import uuid
from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from interviews.models import InterviewAnalysisReport
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


class FinishInterviewViewCompletedTests(TestCase):
  """FinishInterviewView — 정상 종료(모든 답변 완료) 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    # 모든 턴에 답변 완료
    InterviewTurnFactory(interview_session=self.session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=self.session, answer="답변2", turn_number=2)
    self.url = reverse("interview-finish", kwargs={"interview_session_uuid": str(self.session.pk)})

  @patch("api.v1.interviews.views.finish_interview_view.current_app")
  def test_returns_200(self, mock_celery):
    """정상 종료 시 200을 반환한다."""
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  @patch("api.v1.interviews.views.finish_interview_view.current_app")
  def test_session_status_set_to_completed(self, mock_celery):
    """모든 답변이 완료된 경우 세션 상태가 completed로 변경된다."""
    self.client.post(self.url)
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.COMPLETED)

  @patch("api.v1.interviews.views.finish_interview_view.current_app")
  def test_creates_analysis_report(self, mock_celery):
    """분석 리포트 레코드가 생성된다."""
    self.client.post(self.url)
    self.assertTrue(InterviewAnalysisReport.objects.filter(interview_session=self.session).exists())

  @patch("api.v1.interviews.views.finish_interview_view.current_app")
  def test_sends_celery_task(self, mock_celery):
    """Celery 분석 태스크가 발행된다."""
    self.client.post(self.url)
    mock_celery.send_task.assert_called_once()
    call_args = mock_celery.send_task.call_args
    self.assertEqual(call_args[1]["queue"], "analysis")

  @patch("api.v1.interviews.views.finish_interview_view.current_app")
  def test_response_contains_session_data(self, mock_celery):
    """응답에 세션 데이터가 포함된다."""
    response = self.client.post(self.url)
    self.assertIn("uuid", response.data)
    self.assertIn("interview_session_status", response.data)


class FinishInterviewViewAbandonedTests(TestCase):
  """FinishInterviewView — 중도 종료(미답변 턴 존재) 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    # 미답변 턴 포함
    InterviewTurnFactory(interview_session=self.session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=self.session, answer="", turn_number=2)
    self.url = reverse("interview-finish", kwargs={"interview_session_uuid": str(self.session.pk)})

  @patch("api.v1.interviews.views.finish_interview_view.current_app")
  def test_session_status_set_to_abandoned(self, mock_celery):
    """미답변 턴이 있으면 세션 상태가 abandoned로 변경된다."""
    self.client.post(self.url)
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.ABANDONED)

  @patch("api.v1.interviews.views.finish_interview_view.current_app")
  def test_creates_analysis_report_even_when_abandoned(self, mock_celery):
    """중도 종료 시에도 분석 리포트 레코드가 생성된다."""
    self.client.post(self.url)
    self.assertTrue(InterviewAnalysisReport.objects.filter(interview_session=self.session).exists())


class FinishInterviewViewErrorTests(TestCase):
  """FinishInterviewView — 오류 케이스 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

  def test_already_completed_session_returns_error(self):
    """이미 완료된 세션에 finish를 시도하면 에러를 반환한다."""
    session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    url = reverse("interview-finish", kwargs={"interview_session_uuid": str(session.pk)})
    response = self.client.post(url)
    self.assertIn(
      response.status_code,
      [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN, status.HTTP_422_UNPROCESSABLE_ENTITY]
    )

  def test_already_abandoned_session_returns_error(self):
    """이미 이탈된 세션에 finish를 시도하면 에러를 반환한다."""
    session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.ABANDONED,
    )
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
