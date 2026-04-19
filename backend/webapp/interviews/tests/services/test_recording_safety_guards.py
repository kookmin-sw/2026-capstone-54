from datetime import timedelta
from unittest.mock import MagicMock, patch

from common.exceptions import ConflictException
from django.test import TestCase
from django.utils import timezone
from interviews.enums import InterviewSessionStatus, RecordingStatus
from interviews.factories import (
  InterviewRecordingFactory,
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from interviews.models import InterviewRecording
from interviews.services import (
  AbortRecordingService,
  CompleteRecordingService,
  InitiateRecordingService,
)
from interviews.tasks.cleanup_stale_recordings_task import CleanupStaleRecordingsTask
from users.factories import UserFactory

MOCK_INITIATE_S3 = "interviews.services.initiate_recording_service.get_video_s3_client"
MOCK_INITIATE_PRESIGN = ("interviews.services.initiate_recording_service.get_video_s3_presign_client")
MOCK_COMPLETE_S3 = "interviews.services.complete_recording_service.get_video_s3_client"
MOCK_ABORT_S3 = "interviews.services.abort_recording_service.get_video_s3_client"


class RecordingSafetyGuardScenarioTests(TestCase):

  def setUp(self):
    self.user = UserFactory()
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.turn = InterviewTurnFactory(interview_session=self.session)

  def _create_mock_s3(self):
    mock_s3 = MagicMock()
    mock_s3.create_multipart_upload.return_value = {"UploadId": "test-upload-id"}
    mock_s3.generate_presigned_url.return_value = "https://presigned.example.com"
    return mock_s3

  # ── Scenario 1: Normal flow ──

  @patch(MOCK_COMPLETE_S3)
  @patch(MOCK_INITIATE_PRESIGN)
  @patch(MOCK_INITIATE_S3)
  def test_scenario_normal_answer_submit(self, mock_s3, mock_presign, mock_complete):
    mock_s3.return_value = self._create_mock_s3()
    mock_presign.return_value = self._create_mock_s3()
    mock_complete.return_value = MagicMock()

    result = InitiateRecordingService(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      media_type="video",
    ).perform()

    recording = InterviewRecording.objects.get(pk=result["recordingId"])
    self.assertEqual(recording.status, RecordingStatus.INITIATED)

    CompleteRecordingService(
      recording=recording,
      parts=[{
        "partNumber": 1,
        "etag": "abc"
      }],
      end_timestamp="2026-04-18T12:05:00Z",
      duration_ms=5000,
      user=self.user,
    ).perform()

    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.COMPLETED)

  # ── Scenario 2: Browser close with successful abort ──

  @patch(MOCK_ABORT_S3)
  @patch(MOCK_INITIATE_PRESIGN)
  @patch(MOCK_INITIATE_S3)
  def test_scenario_browser_close_abort_success(self, mock_s3, mock_presign, mock_abort):
    mock_s3.return_value = self._create_mock_s3()
    mock_presign.return_value = self._create_mock_s3()
    mock_abort.return_value = MagicMock()

    result = InitiateRecordingService(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      media_type="video",
    ).perform()

    recording = InterviewRecording.objects.get(pk=result["recordingId"])
    AbortRecordingService(recording=recording).perform()

    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.FAILED)

  # ── Scenario 3: Reconnect — same turn re-initiate marks previous ABANDONED ──

  @patch(MOCK_INITIATE_PRESIGN)
  @patch(MOCK_INITIATE_S3)
  def test_scenario_reconnect_same_turn_abandons_previous(self, mock_s3, mock_presign):
    mock_s3.return_value = self._create_mock_s3()
    mock_presign.return_value = self._create_mock_s3()

    first_result = InitiateRecordingService(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      media_type="video",
    ).perform()
    first_id = first_result["recordingId"]

    second_result = InitiateRecordingService(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      media_type="video",
    ).perform()
    second_id = second_result["recordingId"]

    first_recording = InterviewRecording.objects.get(pk=first_id)
    second_recording = InterviewRecording.objects.get(pk=second_id)

    self.assertEqual(first_recording.status, RecordingStatus.ABANDONED)
    self.assertEqual(second_recording.status, RecordingStatus.INITIATED)
    self.assertNotEqual(first_id, second_id)

  @patch(MOCK_INITIATE_PRESIGN)
  @patch(MOCK_INITIATE_S3)
  def test_scenario_reconnect_does_not_abandon_completed_recording(self, mock_s3, mock_presign):
    mock_s3.return_value = self._create_mock_s3()
    mock_presign.return_value = self._create_mock_s3()

    completed_recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.COMPLETED,
    )

    InitiateRecordingService(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      media_type="video",
    ).perform()

    completed_recording.refresh_from_db()
    self.assertEqual(completed_recording.status, RecordingStatus.COMPLETED)

  @patch(MOCK_INITIATE_PRESIGN)
  @patch(MOCK_INITIATE_S3)
  def test_scenario_reconnect_abandons_multiple_stale_recordings(self, mock_s3, mock_presign):
    mock_s3.return_value = self._create_mock_s3()
    mock_presign.return_value = self._create_mock_s3()

    stale1 = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )
    stale2 = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.UPLOADING,
    )

    InitiateRecordingService(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      media_type="video",
    ).perform()

    stale1.refresh_from_db()
    stale2.refresh_from_db()
    self.assertEqual(stale1.status, RecordingStatus.ABANDONED)
    self.assertEqual(stale2.status, RecordingStatus.ABANDONED)

  # ── Scenario 4: Cleanup task ──

  def test_scenario_cleanup_task_marks_stale_as_abandoned(self):
    """정리 태스크: 1시간 이상 INITIATED/UPLOADING 상태 녹화가 ABANDONED로 전환된다."""
    stale_recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )
    InterviewRecording.objects.filter(pk=stale_recording.pk).update(created_at=timezone.now() - timedelta(hours=2), )

    result = CleanupStaleRecordingsTask().run()

    stale_recording.refresh_from_db()
    self.assertEqual(stale_recording.status, RecordingStatus.ABANDONED)
    self.assertEqual(result["abandoned_count"], 1)

  def test_scenario_cleanup_task_ignores_recent_recordings(self):
    """정리 태스크: 1시간 미만 INITIATED 상태 녹화는 ABANDONED로 전환되지 않는다."""
    recent_recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.INITIATED,
    )

    result = CleanupStaleRecordingsTask().run()

    recent_recording.refresh_from_db()
    self.assertEqual(recent_recording.status, RecordingStatus.INITIATED)
    self.assertEqual(result["abandoned_count"], 0)

  def test_scenario_cleanup_task_ignores_completed_recordings(self):
    """정리 태스크: COMPLETED 상태 녹화는 시간에 관계없이 ABANDONED로 전환되지 않는다."""
    completed_recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.COMPLETED,
    )
    InterviewRecording.objects.filter(pk=completed_recording.pk
                                      ).update(created_at=timezone.now() - timedelta(hours=5), )

    result = CleanupStaleRecordingsTask().run()

    completed_recording.refresh_from_db()
    self.assertEqual(completed_recording.status, RecordingStatus.COMPLETED)
    self.assertEqual(result["abandoned_count"], 0)

  # ── Scenario 5: Abort rejects completed/ready recordings ──

  @patch("interviews.services.abort_recording_service.get_video_s3_client")
  def test_scenario_abort_rejects_completed(self, mock_s3):
    """COMPLETED 상태 녹화에 대한 abort 요청은 ConflictException을 발생시킨다."""
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.COMPLETED,
    )
    with self.assertRaises(ConflictException):
      AbortRecordingService(recording=recording).perform()

  @patch("interviews.services.abort_recording_service.get_video_s3_client")
  def test_scenario_abort_rejects_ready(self, mock_s3):
    """READY 상태 녹화에 대한 abort 요청은 ConflictException을 발생시킨다."""
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.READY,
    )
    with self.assertRaises(ConflictException):
      AbortRecordingService(recording=recording).perform()

  # ── Scenario 6: Recording list excludes abandoned ──

  def test_scenario_list_excludes_abandoned_recordings(self):
    """녹화 목록 조회 시 ABANDONED 상태 녹화가 제외된다."""
    InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.COMPLETED,
    )
    InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.ABANDONED,
    )
    InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.FAILED,
    )

    visible = InterviewRecording.objects.filter(
      interview_session=self.session,
      user=self.user,
    ).exclude(status=RecordingStatus.ABANDONED)

    self.assertEqual(visible.count(), 2)
    statuses = set(visible.values_list("status", flat=True))
    self.assertNotIn(RecordingStatus.ABANDONED, statuses)

  # ── Scenario 7: Full lifecycle — answer, leave, reconnect, answer again ──

  @patch(MOCK_COMPLETE_S3)
  @patch(MOCK_INITIATE_PRESIGN)
  @patch(MOCK_INITIATE_S3)
  def test_scenario_full_lifecycle_leave_and_reconnect(self, mock_s3, mock_presign, mock_complete):
    mock_s3.return_value = self._create_mock_s3()
    mock_presign.return_value = self._create_mock_s3()
    mock_complete.return_value = MagicMock()

    first_result = InitiateRecordingService(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      media_type="video",
    ).perform()
    first_id = first_result["recordingId"]

    second_result = InitiateRecordingService(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      media_type="video",
    ).perform()
    second_id = second_result["recordingId"]

    first_recording = InterviewRecording.objects.get(pk=first_id)
    self.assertEqual(first_recording.status, RecordingStatus.ABANDONED)

    second_recording = InterviewRecording.objects.get(pk=second_id)
    CompleteRecordingService(
      recording=second_recording,
      parts=[{
        "partNumber": 1,
        "etag": "abc"
      }],
      end_timestamp="2026-04-18T13:05:00Z",
      duration_ms=30000,
      user=self.user,
    ).perform()

    second_recording.refresh_from_db()
    self.assertEqual(second_recording.status, RecordingStatus.COMPLETED)

    visible = InterviewRecording.objects.filter(
      interview_session=self.session,
      interview_turn=self.turn,
    ).exclude(status=RecordingStatus.ABANDONED)
    self.assertEqual(visible.count(), 1)
    self.assertEqual(visible.first().pk, second_recording.pk)
