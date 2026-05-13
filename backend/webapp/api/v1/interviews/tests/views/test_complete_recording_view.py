from unittest.mock import MagicMock, patch

from api.v1.interviews.tests.ownership_test_helpers import OwnershipHeadersMixin
from django.test import TestCase
from interviews.enums import InterviewSessionStatus, RecordingStatus
from interviews.factories import (
  InterviewRecordingFactory,
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from rest_framework import status
from rest_framework.test import APIClient
from users.factories import UserFactory

BASE = "/api/v1/interviews"


class CompleteRecordingViewTests(OwnershipHeadersMixin, TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.authenticate_with_ownership(self.user, self.session)
    self.turn = InterviewTurnFactory(interview_session=self.session)

  @patch("api.v1.interviews.views.complete_recording_view.CompleteRecordingService")
  def test_complete_recording_endpoint_returns_200(self, mock_service_class):
    mock_service = MagicMock()
    mock_service_class.return_value = mock_service

    recording = InterviewRecordingFactory(
      interview_session=self.session, interview_turn=self.turn, user=self.user, status=RecordingStatus.INITIATED
    )

    data = {
      "parts": [{
        "part_number": 1,
        "etag": "etag1"
      }],
      "end_timestamp": "2026-04-27T12:00:00Z",
      "duration_ms": 1000,
    }

    response = self.client.post(f"{BASE}/recordings/{recording.uuid}/complete/", data, format="json")
    self.assertEqual(response.status_code, status.HTTP_200_OK)
