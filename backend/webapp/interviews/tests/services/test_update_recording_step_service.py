from unittest.mock import MagicMock, patch

from common.exceptions import ConflictException, NotFoundException
from django.db import IntegrityError
from django.test import TestCase
from interviews.enums import InterviewSessionStatus, RecordingStatus
from interviews.factories import (
  InterviewRecordingFactory,
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from interviews.models import InterviewRecording
from interviews.services import InitiateRecordingService, UpdateRecordingStepService
from users.factories import UserFactory

MOCK_INITIATE_S3 = "interviews.services.initiate_recording_service.get_video_s3_client"


class UpdateRecordingStepServiceIdentificationTests(TestCase):

  def setUp(self):
    self.user = UserFactory()
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.turn = InterviewTurnFactory(interview_session=self.session)

  def test_identifies_recording_by_source_s3_key_even_with_abandoned_sibling(self):
    """탭 닫기→재진입 시나리오: ABANDONED + 새 active 가 공존할 때 source_s3_key 로 정확히 새 것만 갱신."""
    abandoned = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.ABANDONED,
      s3_key=f"{self.session.pk}/{self.turn.pk}/100.webm",
    )
    active = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.PROCESSING,
      s3_key=f"{self.session.pk}/{self.turn.pk}/200.webm",
    )

    UpdateRecordingStepService(
      session_uuid=str(self.session.pk),
      turn_id=str(self.turn.pk),
      field_name="scaled_video_key",
      output_key="scaled/200.mp4",
      source_s3_key=active.s3_key,
    ).perform()

    active.refresh_from_db()
    abandoned.refresh_from_db()
    self.assertEqual(active.scaled_video_key, "scaled/200.mp4")
    self.assertEqual(abandoned.scaled_video_key, "")

  def test_falls_back_to_latest_active_when_source_s3_key_missing(self):
    """옛 Lambda 메시지 호환: source_s3_key 없으면 active 중 가장 최근 1개 갱신."""
    older_active = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.ABANDONED,
      s3_key=f"{self.session.pk}/{self.turn.pk}/100.webm",
    )
    newer_active = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.PROCESSING,
      s3_key=f"{self.session.pk}/{self.turn.pk}/200.webm",
    )

    UpdateRecordingStepService(
      session_uuid=str(self.session.pk),
      turn_id=str(self.turn.pk),
      field_name="audio_key",
      output_key="audio/200.wav",
      source_s3_key="",
    ).perform()

    newer_active.refresh_from_db()
    older_active.refresh_from_db()
    self.assertEqual(newer_active.audio_key, "audio/200.wav")
    self.assertEqual(older_active.audio_key, "")

  def test_returns_not_found_when_source_s3_key_matches_no_recording(self):
    """ABANDONED 후 takeover 등으로 폐기된 recording 의 step-complete 가 늦게 도착하면 NotFoundException."""
    InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.PROCESSING,
      s3_key=f"{self.session.pk}/{self.turn.pk}/200.webm",
    )

    with self.assertRaises(NotFoundException):
      UpdateRecordingStepService(
        session_uuid=str(self.session.pk),
        turn_id=str(self.turn.pk),
        field_name="scaled_video_key",
        output_key="scaled/999.mp4",
        source_s3_key=f"{self.session.pk}/{self.turn.pk}/999.webm",
      ).perform()

  def test_marks_ready_when_all_four_steps_complete(self):
    """4개 step (scaled_video_key, frame_prefix, scaled_audio_key, face_analysis_result_key) 모두 채워지면 READY."""
    recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.PROCESSING,
      s3_key=f"{self.session.pk}/{self.turn.pk}/200.webm",
      scaled_video_key="v.mp4",
      frame_prefix="frames/",
      scaled_audio_key="a.wav",
    )

    UpdateRecordingStepService(
      session_uuid=str(self.session.pk),
      turn_id=str(self.turn.pk),
      field_name="face_analysis_result_key",
      output_key="face.json",
      source_s3_key=recording.s3_key,
    ).perform()

    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.READY)
    self.assertEqual(recording.face_analysis_result_key, "face.json")

  def test_invalid_field_name_raises(self):
    with self.assertRaises(ValueError):
      UpdateRecordingStepService(
        session_uuid=str(self.session.pk),
        turn_id=str(self.turn.pk),
        field_name="not_a_real_field",
        output_key="x",
      ).perform()


class InitiateRecordingActiveUniquenessTests(TestCase):

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
    return mock_s3

  def test_partial_unique_constraint_blocks_concurrent_active_recording(self):
    """1:1 정책: COMPLETED active 가 있는 turn 에 INITIATED 를 직접 INSERT 하면 IntegrityError."""
    InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.COMPLETED,
      s3_key=f"{self.session.pk}/{self.turn.pk}/100.webm",
    )

    with self.assertRaises(IntegrityError):
      InterviewRecording.objects.create(
        interview_session=self.session,
        interview_turn=self.turn,
        user=self.user,
        media_type="video",
        status=RecordingStatus.INITIATED,
        s3_bucket="bucket",
        s3_key=f"{self.session.pk}/{self.turn.pk}/200.webm",
        upload_id="x",
      )

  def test_abandoned_recordings_do_not_trigger_constraint(self):
    """ABANDONED 는 constraint 에서 제외되므로 N개 공존 가능."""
    InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.ABANDONED,
      s3_key=f"{self.session.pk}/{self.turn.pk}/100.webm",
    )
    InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.ABANDONED,
      s3_key=f"{self.session.pk}/{self.turn.pk}/200.webm",
    )
    InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.PROCESSING,
      s3_key=f"{self.session.pk}/{self.turn.pk}/300.webm",
    )

    abandoned_count = InterviewRecording.objects.filter(
      interview_turn=self.turn,
      status=RecordingStatus.ABANDONED,
    ).count()
    self.assertEqual(abandoned_count, 2)

  @patch(MOCK_INITIATE_S3)
  def test_initiate_converts_integrity_error_to_conflict_exception(self, mock_s3_factory):
    """COMPLETED active 가 있는 상태에서 InitiateRecordingService 가 호출되면 ConflictException."""
    mock_s3_factory.return_value = self._create_mock_s3()

    InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.COMPLETED,
      s3_key=f"{self.session.pk}/{self.turn.pk}/100.webm",
    )

    with self.assertRaises(ConflictException):
      InitiateRecordingService(
        interview_session=self.session,
        interview_turn=self.turn,
        user=self.user,
        media_type="video",
      ).perform()
