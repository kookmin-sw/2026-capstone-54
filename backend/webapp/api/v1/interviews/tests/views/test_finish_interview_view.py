import uuid

from api.v1.interviews.tests.ownership_test_helpers import OwnershipHeadersMixin
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


class FinishInterviewViewCompletedTests(OwnershipHeadersMixin, TestCase):
  """FinishInterviewView — 정상 종료(모든 답변 완료) 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.authenticate_with_ownership(self.user, self.session)
    InterviewTurnFactory(interview_session=self.session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=self.session, answer="답변2", turn_number=2)
    self.url = reverse("interview-finish", kwargs={"interview_session_uuid": str(self.session.pk)})

  def test_returns_200(self):
    """정상 종료 시 200을 반환한다."""
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_session_status_set_to_completed(self):
    """모든 답변이 완료된 경우 세션 상태가 completed로 변경된다."""
    self.client.post(self.url)
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.COMPLETED)

  def test_response_contains_session_data(self):
    """응답에 세션 데이터가 포함된다."""
    response = self.client.post(self.url)
    self.assertIn("uuid", response.data)
    self.assertIn("interview_session_status", response.data)


class FinishInterviewViewWithUnansweredTurnsTests(OwnershipHeadersMixin, TestCase):
  """FinishInterviewView — 미답변 턴이 있어도 정상 종료 테스트 (이어하기 정책)"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.authenticate_with_ownership(self.user, self.session)
    InterviewTurnFactory(interview_session=self.session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=self.session, answer="", turn_number=2)
    self.url = reverse("interview-finish", kwargs={"interview_session_uuid": str(self.session.pk)})

  def test_returns_200(self):
    """미답변 턴이 있어도 200을 반환한다."""
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_session_status_set_to_completed(self):
    """미답변 턴이 있어도 세션 상태가 completed로 변경된다."""
    self.client.post(self.url)
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.COMPLETED)


class FinishInterviewViewErrorTests(OwnershipHeadersMixin, TestCase):
  """FinishInterviewView — 오류 케이스 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

  def _authorize_for_session(self, session) -> None:
    self.authenticate_with_ownership(self.user, session)

  def test_already_completed_session_returns_error(self):
    """이미 완료된 세션에 finish를 시도하면 에러를 반환한다."""
    session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    self._authorize_for_session(session)
    url = reverse("interview-finish", kwargs={"interview_session_uuid": str(session.pk)})
    response = self.client.post(url)
    self.assertIn(
      response.status_code,
      [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN, status.HTTP_422_UNPROCESSABLE_ENTITY]
    )

  def test_other_user_session_returns_404(self):
    """다른 사용자의 세션이면 404를 반환한다."""
    other_session = InterviewSessionFactory()
    url = reverse("interview-finish", kwargs={"interview_session_uuid": str(other_session.pk)})
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    session = InterviewSessionFactory(user=self.user)
    url = reverse("interview-finish", kwargs={"interview_session_uuid": str(session.pk)})
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_nonexistent_session_returns_404(self):
    """존재하지 않는 세션 UUID이면 404를 반환한다."""
    url = reverse("interview-finish", kwargs={"interview_session_uuid": str(uuid.uuid4())})
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
