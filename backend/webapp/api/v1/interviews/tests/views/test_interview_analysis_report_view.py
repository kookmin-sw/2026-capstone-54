import uuid

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewAnalysisReportStatus, InterviewSessionStatus
from interviews.factories import InterviewAnalysisReportFactory, InterviewSessionFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


class InterviewAnalysisReportViewTests(TestCase):
  """InterviewAnalysisReportView GET 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    self.report = InterviewAnalysisReportFactory(
      interview_session=self.session,
      interview_analysis_report_status=InterviewAnalysisReportStatus.COMPLETED,
    )
    self.url = reverse("interview-report", kwargs={"interview_session_uuid": str(self.session.pk)})

  def test_returns_200_with_report_data(self):
    """리포트가 존재하면 200과 리포트 데이터를 반환한다."""
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_response_contains_status_field(self):
    """응답에 interview_analysis_report_status 필드가 포함된다."""
    response = self.client.get(self.url)
    self.assertIn("interview_analysis_report_status", response.data)

  def test_pending_report_returns_200(self):
    """pending 상태의 리포트도 200으로 반환된다."""
    self.report.interview_analysis_report_status = InterviewAnalysisReportStatus.PENDING
    self.report.save(update_fields=["interview_analysis_report_status"])
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["interview_analysis_report_status"], InterviewAnalysisReportStatus.PENDING)

  def test_no_report_returns_404(self):
    """리포트가 없으면 404를 반환한다."""
    session_without_report = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    url = reverse("interview-report", kwargs={"interview_session_uuid": str(session_without_report.pk)})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_other_user_session_returns_404(self):
    """다른 사용자의 세션이면 404를 반환한다."""
    other_session = InterviewSessionFactory()
    InterviewAnalysisReportFactory(interview_session=other_session)
    url = reverse("interview-report", kwargs={"interview_session_uuid": str(other_session.pk)})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_nonexistent_session_returns_404(self):
    """존재하지 않는 세션 UUID이면 404를 반환한다."""
    url = reverse("interview-report", kwargs={"interview_session_uuid": str(uuid.uuid4())})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
