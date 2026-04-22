from unittest.mock import MagicMock

from common.permissions import AllowAny, IsAuthenticated, IsEmailVerified, IsProfileCompleted
from django.test import override_settings
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework.test import APIRequestFactory


def make_user(is_authenticated=True, email_confirmed=False, profile_completed=False):
  """테스트용 사용자 객체를 생성한다."""
  user = MagicMock()
  user.is_authenticated = is_authenticated
  user.is_email_confirmed = email_confirmed
  user.is_profile_completed = profile_completed
  return user


def make_request(user=None):
  """테스트용 request 객체를 생성한다."""
  factory = APIRequestFactory()
  request = factory.get("/fake-url")
  if user is not None:
    request.user = user
  else:
    request.user = MagicMock(is_authenticated=False)
  return request


# Hypothesis strategy: user state combinations
user_state_strategy = st.fixed_dictionaries(
  {
    "is_authenticated": st.booleans(),
    "email_confirmed": st.booleans(),
    "profile_completed": st.booleans(),
  }
)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class TestPermissionAccessControlProperty(TestCase):
  """Permission 클래스 접근 제어 property 테스트"""

  def setUp(self):
    self.view = MagicMock()

  @given(state=user_state_strategy)
  @settings(max_examples=5, deadline=None)
  def test_allow_any_permits_all_requests(self, state):
    """AllowAny는 사용자 상태와 관계없이 모든 요청을 허용한다."""
    user = make_user(
      is_authenticated=state["is_authenticated"],
      email_confirmed=state["email_confirmed"],
      profile_completed=state["profile_completed"],
    )
    request = make_request(user)
    permission = AllowAny()

    result = permission.has_permission(request, self.view)

    self.assertTrue(result)

  @given(state=user_state_strategy)
  @settings(max_examples=5, deadline=None)
  def test_is_authenticated_only_allows_authenticated_users(self, state):
    """IsAuthenticated는 인증된 사용자만 허용하고, 미인증 시 거부한다."""
    user = make_user(
      is_authenticated=state["is_authenticated"],
      email_confirmed=state["email_confirmed"],
      profile_completed=state["profile_completed"],
    )
    request = make_request(user)
    permission = IsAuthenticated()

    result = permission.has_permission(request, self.view)

    if state["is_authenticated"]:
      self.assertTrue(result)
    else:
      self.assertFalse(result)

  @given(state=user_state_strategy)
  @settings(max_examples=5, deadline=None)
  def test_is_email_verified_requires_authenticated_and_email_confirmed(self, state):
    """IsEmailVerified는 인증 + email_confirmed_at 설정된 사용자만 허용한다."""
    user = make_user(
      is_authenticated=state["is_authenticated"],
      email_confirmed=state["email_confirmed"],
      profile_completed=state["profile_completed"],
    )
    request = make_request(user)
    permission = IsEmailVerified()

    if state["is_authenticated"] and state["email_confirmed"]:
      result = permission.has_permission(request, self.view)
      self.assertTrue(result)
    elif state["is_authenticated"] and not state["email_confirmed"]:
      from common.exceptions import PermissionDeniedException

      with self.assertRaises(PermissionDeniedException):
        permission.has_permission(request, self.view)
    else:
      result = permission.has_permission(request, self.view)
      self.assertFalse(result)

  @given(state=user_state_strategy)
  @settings(max_examples=5, deadline=None)
  def test_is_profile_completed_requires_all_conditions(self, state):
    """IsProfileCompleted는 인증 + email_confirmed_at + profile_completed_at 모두 설정된 사용자만 허용한다."""
    user = make_user(
      is_authenticated=state["is_authenticated"],
      email_confirmed=state["email_confirmed"],
      profile_completed=state["profile_completed"],
    )
    request = make_request(user)
    permission = IsProfileCompleted()

    if state["is_authenticated"] and state["email_confirmed"] and state["profile_completed"]:
      result = permission.has_permission(request, self.view)
      self.assertTrue(result)
    elif state["is_authenticated"] and not state["email_confirmed"]:
      from common.exceptions import PermissionDeniedException

      with self.assertRaises(PermissionDeniedException):
        permission.has_permission(request, self.view)
    elif state["is_authenticated"] and state["email_confirmed"] and not state["profile_completed"]:
      from common.exceptions import PermissionDeniedException

      with self.assertRaises(PermissionDeniedException):
        permission.has_permission(request, self.view)
    else:
      result = permission.has_permission(request, self.view)
      self.assertFalse(result)
