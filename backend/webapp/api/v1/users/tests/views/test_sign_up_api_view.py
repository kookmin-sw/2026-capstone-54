from django.contrib.auth.models import BaseUserManager
from django.test import override_settings
from django.urls import reverse
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TransactionTestCase
from rest_framework import status
from rest_framework.test import APIClient
from users.factories import DEFAULT_PASSWORD
from users.models import User


@override_settings(
  EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
  CELERY_TASK_ALWAYS_EAGER=True,
  CELERY_TASK_EAGER_PROPAGATES=True,
)
class SignUpAPIViewPropertyTests(TransactionTestCase):
  """SignUpAPIView property 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("sign-up")

    # FREE 플랜 티켓 정책 생성
    from subscriptions.enums import PlanType
    from subscriptions.models import SubscriptionPlanTicketPolicy
    SubscriptionPlanTicketPolicy.objects.get_or_create(
      plan_type=PlanType.FREE, defaults={
        "daily_ticket_amount": 5,
        "is_active": True
      }
    )

  @given(email=st.emails())
  @settings(max_examples=5, deadline=None)
  def test_sign_up_success_creates_user_and_returns_full_response(self, email):
    """유효한 name/email/password로 회원가입하면 201, User 생성, 완전한 응답 반환, EmailVerificationCode 생성된다."""
    normalized_email = BaseUserManager.normalize_email(email)
    User.objects.filter(email=normalized_email).delete()

    data = {
      "name": "테스트유저",
      "email": email,
      "password1": DEFAULT_PASSWORD,
      "password2": DEFAULT_PASSWORD,
    }
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # User가 DB에 생성되어야 한다 (이메일은 도메인이 소문자로 정규화됨)
    self.assertTrue(User.objects.filter(email=normalized_email).exists())

    # 응답에 access, refresh, is_email_confirmed, is_profile_completed 필드가 포함되어야 한다
    self.assertIn("access", response.data)
    self.assertIn("is_email_confirmed", response.data)
    self.assertIn("is_profile_completed", response.data)
    self.assertIn("mefit_refresh", response.cookies)

    # is_email_confirmed, is_profile_completed은 False여야 한다
    self.assertFalse(response.data["is_email_confirmed"])
    self.assertFalse(response.data["is_profile_completed"])

    # EmailVerificationCode가 생성되어야 한다
    user = User.objects.get(email=normalized_email)
    self.assertTrue(user.email_verification_codes.exists())

  def test_sign_up_success_grants_initial_tickets(self):
    """회원가입 시 사용자에게 초기 티켓이 지급된다."""
    from subscriptions.enums import PlanType
    from subscriptions.models import SubscriptionPlanTicketPolicy
    from tickets.models import UserTicket

    email = "ticket_test@example.com"
    User.objects.filter(email=email).delete()

    # FREE 플랜의 티켓 정책 조회
    policy = SubscriptionPlanTicketPolicy.objects.get(plan_type=PlanType.FREE)

    data = {
      "name": "테스트유저",
      "email": email,
      "password1": DEFAULT_PASSWORD,
      "password2": DEFAULT_PASSWORD,
    }
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    # 사용자가 생성되었는지 확인
    user = User.objects.get(email=email)

    # 사용자에게 티켓이 지급되었는지 확인
    self.assertTrue(UserTicket.objects.filter(user=user).exists())
    user_ticket = UserTicket.objects.get(user=user)
    self.assertEqual(user_ticket.daily_count, policy.daily_ticket_amount)
    self.assertEqual(user_ticket.purchased_count, 0)

  @given(
    password1=st.text(
      min_size=8,
      max_size=20,
      alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd")),
    ),
    password2=st.text(
      min_size=8,
      max_size=20,
      alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd")),
    ),
  )
  @settings(max_examples=5, deadline=None)
  def test_sign_up_fails_when_passwords_do_not_match(self, password1, password2):
    """password1 ≠ password2이면 400 에러가 반환되고 User가 생성되지 않는다."""
    from hypothesis import assume

    assume(password1 != password2)

    email = "mismatch_test@example.com"
    User.objects.filter(email=email).delete()
    before_count = User.objects.count()

    data = {
      "name": "테스트유저",
      "email": email,
      "password1": password1,
      "password2": password2,
    }
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(User.objects.count(), before_count)

  @given(email=st.emails())
  @settings(max_examples=5, deadline=None)
  def test_sign_up_fails_with_duplicate_email(self, email):
    """이미 등록된 이메일로 회원가입을 시도하면 4xx 에러가 반환되고 새로운 User가 생성되지 않는다."""
    normalized_email = BaseUserManager.normalize_email(email)
    User.objects.filter(email=normalized_email).delete()

    # 첫 번째 가입
    data = {
      "name": "첫번째유저",
      "email": email,
      "password1": DEFAULT_PASSWORD,
      "password2": DEFAULT_PASSWORD,
    }
    first_response = self.client.post(self.url, data, format="json")
    self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

    user_count_after_first = User.objects.filter(email=normalized_email).count()

    # 동일 이메일로 두 번째 가입 시도
    data["name"] = "두번째유저"
    second_response = self.client.post(self.url, data, format="json")

    # 중복 이메일은 400(serializer validation) 또는 409(DB unique constraint)를 반환한다
    self.assertIn(
      second_response.status_code,
      [status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT],
    )
    # 새로운 User가 생성되지 않아야 한다
    self.assertEqual(User.objects.filter(email=normalized_email).count(), user_count_after_first)
