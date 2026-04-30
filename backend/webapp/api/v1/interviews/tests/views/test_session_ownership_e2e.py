"""세션 ownership 헤더 검증의 end-to-end 흐름 테스트.

검증 포인트:
1. mutate 엔드포인트 (initiate/complete/abort/submit_answer/finish) 가 owner 헤더 부착 시 통과
2. 동일 엔드포인트가 owner 헤더 누락 시 409 SESSION_OWNER_REQUIRED 반환
3. 잘못된 owner_version 시 409 SESSION_OWNER_CHANGED 반환
4. read-only / no-validation 엔드포인트 (presign-part / generate-report) 는 owner 헤더 없어도 통과
"""

import uuid
from unittest.mock import MagicMock, patch

from api.v1.interviews.tests.ownership_test_helpers import OwnershipHeadersMixin
from django.test import TestCase
from django.urls import reverse
from interviews.enums import InterviewSessionStatus, InterviewSessionType, RecordingMediaType, RecordingStatus
from interviews.factories import (
  InterviewRecordingFactory,
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory

BASE = "/api/v1/interviews"


class _BaseFlowSetup(OwnershipHeadersMixin, TestCase):
  """공통 setUp — 사용자 + IN_PROGRESS 세션 + turn + 녹화 객체 + ownership 헤더."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.authenticate_with_ownership(self.user, self.session)
    self.turn = InterviewTurnFactory(interview_session=self.session)
    self.recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.UPLOADING,
      media_type=RecordingMediaType.VIDEO,
    )

  def _strip_owner_headers(self):
    """소유 헤더만 제거하고 access token 인증은 유지."""
    refresh_token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh_token.access_token}")

  def _set_wrong_owner_version(self):
    """token 은 맞지만 version 만 stale 한 상태."""
    refresh_token = RefreshToken.for_user(self.user)
    self.client.credentials(
      HTTP_AUTHORIZATION=f"Bearer {refresh_token.access_token}",
      HTTP_X_SESSION_OWNER_TOKEN=self.TEST_OWNER_TOKEN,
      HTTP_X_SESSION_OWNER_VERSION="999",
    )


class InitiateRecordingOwnershipE2ETests(_BaseFlowSetup):
  """녹화 시작 mutate 엔드포인트의 owner 검증 e2e."""

  @patch("api.v1.interviews.views.initiate_recording_view.InitiateRecordingService")
  def test_with_valid_owner_headers_returns_201(self, mock_service_class):
    """유효한 owner 헤더와 함께 호출하면 201 을 반환한다."""
    mock_service = MagicMock()
    mock_service.perform.return_value = {
      "recordingId": str(uuid.uuid4()),
      "uploadId": "upload-id",
      "s3Key": "key",
    }
    mock_service_class.return_value = mock_service

    response = self.client.post(
      f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/",
      {
        "turnId": self.turn.pk,
        "mediaType": "video"
      },
      format="json",
    )

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)

  def test_without_owner_headers_returns_409_session_owner_required(self):
    """owner 헤더 누락 시 409 SESSION_OWNER_REQUIRED 를 반환한다."""
    self._strip_owner_headers()

    response = self.client.post(
      f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/",
      {
        "turnId": self.turn.pk,
        "mediaType": "video"
      },
      format="json",
    )

    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
    self.assertEqual(
      response.data.get("errorCode") or response.data.get("error_code"),
      "SESSION_OWNER_REQUIRED",
    )

  def test_with_stale_owner_version_returns_409_session_owner_changed(self):
    """version 만 stale 한 owner 헤더는 409 SESSION_OWNER_CHANGED 를 반환한다."""
    self._set_wrong_owner_version()

    response = self.client.post(
      f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/",
      {
        "turnId": self.turn.pk,
        "mediaType": "video"
      },
      format="json",
    )

    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
    self.assertEqual(
      response.data.get("errorCode") or response.data.get("error_code"),
      "SESSION_OWNER_CHANGED",
    )


class CompleteRecordingOwnershipE2ETests(_BaseFlowSetup):
  """녹화 완료 mutate 엔드포인트의 owner 검증 e2e."""

  @patch("api.v1.interviews.views.complete_recording_view.CompleteRecordingService")
  def test_with_valid_owner_headers_returns_200(self, mock_service_class):
    """유효한 owner 헤더와 함께 호출하면 200 을 반환한다."""
    mock_service = MagicMock()
    mock_service.perform.return_value = MagicMock(uuid=self.recording.pk, status=RecordingStatus.COMPLETED)
    mock_service_class.return_value = mock_service

    response = self.client.post(
      f"{BASE}/recordings/{self.recording.pk}/complete/",
      {
        "parts": [{
          "partNumber": 1,
          "etag": "etag1"
        }],
        "endTimestamp": "2026-04-27T12:00:00Z",
        "durationMs": 1000,
      },
      format="json",
    )

    self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_201_CREATED))

  def test_without_owner_headers_returns_409(self):
    """owner 헤더 누락 시 409 SESSION_OWNER_REQUIRED."""
    self._strip_owner_headers()

    response = self.client.post(
      f"{BASE}/recordings/{self.recording.pk}/complete/",
      {
        "parts": [{
          "partNumber": 1,
          "etag": "etag1"
        }],
        "endTimestamp": "2026-04-27T12:00:00Z",
        "durationMs": 1000,
      },
      format="json",
    )

    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
    self.assertEqual(
      response.data.get("errorCode") or response.data.get("error_code"),
      "SESSION_OWNER_REQUIRED",
    )


class AbortRecordingOwnershipE2ETests(_BaseFlowSetup):
  """녹화 중단 mutate 엔드포인트의 owner 검증 e2e."""

  @patch("api.v1.interviews.views.abort_recording_view.AbortRecordingService")
  def test_with_valid_owner_headers_returns_204(self, mock_service_class):
    """유효한 owner 헤더와 함께 호출하면 204 또는 200 을 반환한다."""
    mock_service = MagicMock()
    mock_service_class.return_value = mock_service

    response = self.client.post(f"{BASE}/recordings/{self.recording.pk}/abort/")

    self.assertIn(
      response.status_code,
      (status.HTTP_204_NO_CONTENT, status.HTTP_200_OK),
    )

  def test_without_owner_headers_returns_409(self):
    """owner 헤더 누락 시 409 SESSION_OWNER_REQUIRED."""
    self._strip_owner_headers()

    response = self.client.post(f"{BASE}/recordings/{self.recording.pk}/abort/")

    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
    self.assertEqual(
      response.data.get("errorCode") or response.data.get("error_code"),
      "SESSION_OWNER_REQUIRED",
    )


class SubmitAnswerOwnershipE2ETests(_BaseFlowSetup):
  """답변 제출 mutate 엔드포인트의 owner 검증 e2e."""

  def test_without_owner_headers_returns_409(self):
    """owner 헤더 누락 시 409 SESSION_OWNER_REQUIRED."""
    self._strip_owner_headers()

    response = self.client.post(
      f"{BASE}/interview-sessions/{self.session.uuid}/turns/{self.turn.pk}/answer/",
      {"answer": "테스트 답변"},
      format="json",
    )

    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
    self.assertEqual(
      response.data.get("errorCode") or response.data.get("error_code"),
      "SESSION_OWNER_REQUIRED",
    )


class FinishInterviewOwnershipE2ETests(_BaseFlowSetup):
  """면접 종료 mutate 엔드포인트의 owner 검증 e2e."""

  def test_without_owner_headers_returns_409(self):
    """owner 헤더 누락 시 409 SESSION_OWNER_REQUIRED."""
    self._strip_owner_headers()

    response = self.client.post(f"{BASE}/interview-sessions/{self.session.uuid}/finish/")

    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
    self.assertEqual(
      response.data.get("errorCode") or response.data.get("error_code"),
      "SESSION_OWNER_REQUIRED",
    )


class PresignPartOwnerExemptE2ETests(_BaseFlowSetup):
  """presign-part GET 엔드포인트는 owner 검증 면제 — 헤더 없이도 통과해야 한다."""

  @patch("api.v1.interviews.views.presign_part_view.get_video_s3_presign_client")
  def test_without_owner_headers_does_not_fail_with_session_owner_required(self, mock_get_s3):
    """presign-part 는 owner 헤더 없이도 SESSION_OWNER_REQUIRED 가 발생하지 않는다."""
    self._strip_owner_headers()
    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://example.com/signed"
    mock_get_s3.return_value = mock_s3

    response = self.client.get(f"{BASE}/recordings/{self.recording.pk}/presign-part/?partNumber=1")

    self.assertNotEqual(
      response.data.get("errorCode") or response.data.get("error_code") if hasattr(response, "data") else None,
      "SESSION_OWNER_REQUIRED",
    )


class GenerateReportOwnerExemptE2ETests(OwnershipHeadersMixin, TestCase):
  """generate-report 엔드포인트는 owner 검증 면제 (종료 후 일회성 trigger)."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(is_email_confirmed=True)
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    refresh_token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh_token.access_token}")

  @patch("interviews.services.regenerate_analysis_report_service.dispatch_report_task")
  @patch("interviews.services.regenerate_analysis_report_service.get_resume_bundle_url")
  def test_without_owner_headers_does_not_fail_with_session_owner_required(self, mock_bundle_url, mock_dispatch):
    """owner 헤더 없이 호출해도 SESSION_OWNER_REQUIRED 는 발생하지 않는다."""
    from tickets.factories import UserTicketFactory

    UserTicketFactory(user=self.user, daily_count=10, purchased_count=0)
    mock_bundle_url.return_value = "https://example.com/bundle.zip"

    url = reverse(
      "interview-generate-report",
      kwargs={"interview_session_uuid": str(self.session.pk)},
    )
    response = self.client.post(url)

    self.assertNotEqual(
      response.data.get("errorCode") or response.data.get("error_code"),
      "SESSION_OWNER_REQUIRED",
    )


class FullRecordingFlowE2ETests(_BaseFlowSetup):
  """녹화 시작 → 완료 전체 흐름이 owner 헤더와 함께 통과하는지 검증."""

  @patch("api.v1.interviews.views.complete_recording_view.CompleteRecordingService")
  @patch("api.v1.interviews.views.initiate_recording_view.InitiateRecordingService")
  def test_initiate_then_complete_with_consistent_owner_headers(self, mock_initiate_class, mock_complete_class):
    """녹화 시작 + 완료가 동일 owner 헤더로 연속 통과한다."""
    new_recording_uuid = str(uuid.uuid4())
    mock_initiate = MagicMock()
    mock_initiate.perform.return_value = {
      "recordingId": new_recording_uuid,
      "uploadId": "upload-id",
      "s3Key": "key",
    }
    mock_initiate_class.return_value = mock_initiate

    mock_complete = MagicMock()
    mock_complete.perform.return_value = MagicMock(uuid=self.recording.pk, status=RecordingStatus.COMPLETED)
    mock_complete_class.return_value = mock_complete

    initiate_response = self.client.post(
      f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/",
      {
        "turnId": self.turn.pk,
        "mediaType": "video"
      },
      format="json",
    )
    self.assertEqual(initiate_response.status_code, status.HTTP_201_CREATED)

    complete_response = self.client.post(
      f"{BASE}/recordings/{self.recording.pk}/complete/",
      {
        "parts": [{
          "partNumber": 1,
          "etag": "etag1"
        }],
        "endTimestamp": "2026-04-27T12:00:00Z",
        "durationMs": 1000,
      },
      format="json",
    )
    self.assertNotEqual(complete_response.status_code, status.HTTP_409_CONFLICT)
