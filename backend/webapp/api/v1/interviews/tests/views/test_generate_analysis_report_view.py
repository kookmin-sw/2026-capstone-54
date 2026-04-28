"""GenerateAnalysisReportView (POST /interview-sessions/{uuid}/generate-report/) 테스트."""

from unittest.mock import patch

from api.v1.interviews.tests.ownership_test_helpers import OwnershipHeadersMixin
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewSessionStatus, TranscriptStatus
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from rest_framework import status
from rest_framework.test import APIClient
from tickets.factories import UserTicketFactory
from users.factories import UserFactory


class GenerateAnalysisReportViewTranscriptBarrierTests(OwnershipHeadersMixin, TestCase):
  """generate-report 의 transcript barrier 검증."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    self.authenticate_with_ownership(self.user, self.session)
    UserTicketFactory(user=self.user, daily_count=10, purchased_count=0)
    self.url = reverse("interview-generate-report", kwargs={"interview_session_uuid": str(self.session.pk)})

  def test_returns_409_when_pending_transcripts_exist(self):
    """PENDING transcript 가 있으면 TRANSCRIPT_PENDING 으로 409."""
    InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.PENDING,
      turn_number=1,
    )

    response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

  def test_returns_409_when_processing_transcripts_exist(self):
    """PROCESSING transcript 가 있으면 TRANSCRIPT_PENDING 으로 409."""
    InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.PROCESSING,
      turn_number=1,
    )

    response = self.client.post(self.url)

    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

  @patch("interviews.services.regenerate_analysis_report_service.dispatch_report_task")
  @patch("interviews.services.regenerate_analysis_report_service.get_resume_bundle_url")
  def test_passes_when_all_transcripts_terminal(self, mock_bundle_url, mock_dispatch):
    """모든 turn 이 COMPLETED/FAILED/None 인 경우 정상 진행 (201)."""
    mock_bundle_url.return_value = "https://example.com/bundle.zip"
    InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.COMPLETED,
      turn_number=1,
    )
    InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.FAILED,
      turn_number=2,
    )
    InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=None,
      turn_number=3,
    )

    response = self.client.post(self.url)

    self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])
