import uuid
from unittest.mock import MagicMock, patch

from api.v1.interviews.tests.ownership_test_helpers import OwnershipHeadersMixin
from django.test import TestCase
from interviews.enums import InterviewSessionStatus
from interviews.factories import (
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from rest_framework import status
from rest_framework.test import APIClient
from users.factories import UserFactory

BASE = "/api/v1/interviews"


class InitiateRecordingViewTests(OwnershipHeadersMixin, TestCase):

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.authenticate_with_ownership(self.user, self.session)
    self.turn = InterviewTurnFactory(interview_session=self.session)

  @patch("api.v1.interviews.views.initiate_recording_view.InitiateRecordingService")
  def test_initiate_recording_endpoint_returns_201(self, mock_service_class):
    recording_uuid = str(uuid.uuid4())
    mock_service = MagicMock()
    mock_service.perform.return_value = {
      "recordingId": recording_uuid,
      "uploadId": "upload-id",
      "s3Key": "key",
    }
    mock_service_class.return_value = mock_service

    data = {"turn_id": self.turn.pk, "media_type": "video"}
    response = self.client.post(
      f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/",
      data,
      format="json",
    )

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertEqual(str(response.data["recording_id"]), recording_uuid)

  def test_initiate_recording_endpoint_requires_auth(self):
    unauth_client = APIClient()
    response = unauth_client.post(f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
