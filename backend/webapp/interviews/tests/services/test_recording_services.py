from unittest.mock import MagicMock, patch

from common.exceptions import ConflictException, PermissionDeniedException
from django.test import TestCase
from interviews.enums import InterviewSessionStatus, RecordingStatus
from interviews.factories import (
  InterviewRecordingFactory,
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from interviews.services import (
  AbortRecordingService,
  CompleteRecordingService,
  GeneratePlaybackUrlService,
  InitiateRecordingService,
)
from users.factories import UserFactory


class RecordingServicesTests(TestCase):
  """면접 녹화 서비스 테스트"""

  def setUp(self):
    self.user = UserFactory()
    self.other_user = UserFactory()
    self.session = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    self.turn = InterviewTurnFactory(interview_session=self.session)

    @patch("interviews.services.initiate_recording_service.get_video_s3_presign_client")
    @patch("interviews.services.initiate_recording_service.get_video_s3_client")
    def test_initiate_recording_creates_record_and_multipart_upload(self, mock_get_client, mock_get_presign):
      """정상적인 녹화 시작 요청 시 레코드를 생성하고 멀티파트 업로드를 초기화한다."""
      mock_s3 = MagicMock()
      mock_get_client.return_value = mock_s3
      mock_s3.create_multipart_upload.return_value = {"UploadId": "test-upload-id"}

      mock_presign = MagicMock()
      mock_get_presign.return_value = mock_presign
      mock_presign.generate_presigned_url.return_value = ("https://presigned-url.example.com")

      result = InitiateRecordingService(
        interview_session=self.session,
        interview_turn=self.turn,
        user=self.user,
        media_type="video",
      ).perform()

      self.assertIn("recordingId", result)
      self.assertIn("singleUploadUrl", result)
      self.assertEqual(result["uploadId"], "test-upload-id")
      self.assertEqual(len(result["presignedUrls"]), 20)
      mock_s3.create_multipart_upload.assert_called_once()

  @patch("interviews.services.initiate_recording_service.get_video_s3_client")
  def test_initiate_recording_rejects_non_in_progress_session(self, mock_get_client):
    """진행 중이 아닌 세션에 대해 녹화 시작 요청 시 ConflictException을 발생시킨다."""
    self.session.interview_session_status = InterviewSessionStatus.COMPLETED
    self.session.save()

    with self.assertRaises(ConflictException):
      InitiateRecordingService(
        interview_session=self.session,
        interview_turn=self.turn,
        user=self.user,
        media_type="video",
      ).perform()
    mock_get_client.assert_not_called()

  @patch("interviews.services.initiate_recording_service.get_video_s3_client")
  def test_initiate_recording_rejects_wrong_user(self, mock_get_client):
    """본인의 세션이 아닌 경우 녹화 시작 요청 시 PermissionDeniedException을 발생시킨다."""
    with self.assertRaises(PermissionDeniedException):
      InitiateRecordingService(
        interview_session=self.session,
        interview_turn=self.turn,
        user=self.other_user,
        media_type="video",
      ).perform()
    mock_get_client.assert_not_called()

  @patch("interviews.services.complete_recording_service.get_video_s3_client")
  def test_complete_recording_completes_multipart_and_updates_status(self, mock_get_client):
    """정상적인 녹화 완료 요청 시 멀티파트 업로드를 완료하고 상태를 COMPLETED로 변경한다."""
    mock_s3 = MagicMock()
    mock_get_client.return_value = mock_s3

    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    parts = [{"part_number": 1, "etag": "test-etag"}]

    CompleteRecordingService(
      recording=recording,
      parts=parts,
      end_timestamp="2023-01-01T00:00:00Z",
      duration_ms=1000,
      user=self.user,
    ).perform()

    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.COMPLETED)
    mock_s3.complete_multipart_upload.assert_called_once()

  @patch("interviews.services.complete_recording_service.get_video_s3_client")
  def test_complete_recording_rejects_already_completed(self, mock_get_client):
    """이미 완료된 녹화에 대해 완료 요청 시 ConflictException을 발생시킨다."""
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.COMPLETED,
    )

    with self.assertRaises(ConflictException):
      CompleteRecordingService(
        recording=recording,
        parts=[],
        end_timestamp="2023-01-01T00:00:00Z",
        duration_ms=1000,
        user=self.user,
      ).perform()
    mock_get_client.assert_not_called()

  @patch("interviews.services.abort_recording_service.get_video_s3_client")
  def test_abort_recording_aborts_multipart_and_sets_failed(self, mock_get_client):
    """정상적인 녹화 중단 요청 시 멀티파트 업로드를 취소하고 상태를 FAILED로 변경한다."""
    mock_s3 = MagicMock()
    mock_get_client.return_value = mock_s3

    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    AbortRecordingService(recording=recording).perform()

    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.FAILED)
    mock_s3.abort_multipart_upload.assert_called_once()

  @patch("interviews.services.abort_recording_service.get_video_s3_client")
  def test_abort_recording_rejects_completed_recording(self, mock_get_client):
    """이미 완료된 녹화에 대해 중단 요청 시 ConflictException을 발생시킨다."""
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.COMPLETED,
    )

    with self.assertRaises(ConflictException):
      AbortRecordingService(recording=recording).perform()
    mock_get_client.assert_not_called()

  @patch("interviews.services.generate_playback_url_service.get_video_s3_presign_client")
  def test_generate_playback_url_returns_presigned_urls(self, mock_get_client):
    """녹화 재생 URL 요청 시 모든 URL 필드를 반환한다."""
    mock_s3 = MagicMock()
    mock_get_client.return_value = mock_s3
    mock_s3.generate_presigned_url.return_value = ("https://presigned-url.example.com")

    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      media_type="video",
      scaled_video_key="scaled.webm",
      audio_key="audio.webm",
    )

    result = GeneratePlaybackUrlService(
      recording=recording,
      user=self.user,
    ).perform()

    self.assertIn("url", result)
    self.assertIn("scaledUrl", result)
    self.assertIn("audioUrl", result)
    self.assertIn("mediaType", result)
    self.assertIn("expiresIn", result)
    self.assertEqual(result["mediaType"], "video")

  @patch("interviews.services.generate_playback_url_service.get_video_s3_presign_client")
  def test_generate_playback_url_rejects_wrong_user(self, mock_get_client):
    """본인의 녹화가 아닌 경우 조회 시 PermissionDeniedException을 발생시킨다."""
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
    )

    with self.assertRaises(PermissionDeniedException):
      GeneratePlaybackUrlService(
        recording=recording,
        user=self.other_user,
      ).perform()
    mock_get_client.assert_not_called()

  @patch("interviews.services.initiate_recording_service.get_video_s3_presign_client")
  @patch("interviews.services.initiate_recording_service.get_video_s3_client")
  def test_initiate_returns_single_upload_url(self, mock_get_client, mock_get_presign):
    """initiate 응답에 singleUploadUrl이 포함된다."""
    mock_s3 = MagicMock()
    mock_get_client.return_value = mock_s3
    mock_s3.create_multipart_upload.return_value = {"UploadId": "test-upload-id"}

    mock_presign = MagicMock()
    mock_get_presign.return_value = mock_presign
    mock_presign.generate_presigned_url.return_value = ("https://presigned.example.com")

    result = InitiateRecordingService(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      media_type="video",
    ).perform()

    self.assertIn("singleUploadUrl", result)
    self.assertEqual(result["singleUploadUrl"], "https://presigned.example.com")

  def test_complete_single_upload_skips_s3_operations(self):
    """단일 업로드 모드에서는 S3 multipart 작업 없이 상태만 COMPLETED로 변경한다."""
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    CompleteRecordingService(
      recording=recording,
      parts=[],
      end_timestamp="2023-01-01T00:00:00Z",
      duration_ms=3000,
      single_upload=True,
      user=self.user,
    ).perform()

    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.COMPLETED)
    self.assertEqual(recording.duration_ms, 3000)

  @patch("interviews.services.abort_recording_service.get_video_s3_client")
  def test_abort_rejects_wrong_user(self, mock_get_client):
    """본인의 녹화가 아닌 경우 abort 시 PermissionDeniedException을 발생시킨다."""
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    with self.assertRaises(PermissionDeniedException):
      AbortRecordingService(recording=recording, user=self.other_user).perform()
    mock_get_client.assert_not_called()
