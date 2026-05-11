"""인터뷰 전체 진행 lifecycle 의 DRF API 레벨 e2e 시나리오.

검증 범위:
  - 정상 완료 (Happy Path): 모든 turn 답변 → finish → COMPLETED
  - 부분 진행 후 이탈: 답변 시점/꼬리질문 진행도별 시나리오
  - Soft pause / Hard exit / Takeover 흐름
  - Lambda step-complete (source_s3_key 기반 1:1 매칭)
  - 1:1 정책 강제 (concurrent initiate → ConflictException)
  - PAUSED 세션 가드, 부분 완료 finish 거부, monitor task 자동 종료

원칙:
  - 외부 의존(S3 / LLM / Channel Layer / Streak / Ticket / Subscription)은 mock
  - DB / Service / View / Serializer / Model constraint 는 실제 동작 검증
  - Lambda 시뮬레이션은 process_video_step_complete.apply 직접 호출
"""

import hashlib
from unittest.mock import MagicMock, patch

from api.v1.interviews.tests.ownership_test_helpers import OwnershipHeadersMixin
from common.exceptions import ConflictException
from django.db import transaction
from django.test import TestCase
from django.utils import timezone
from interviews.constants import FOLLOWUP_ANCHOR_COUNT, MAX_FOLLOWUP_PER_ANCHOR
from interviews.enums import (
  InterviewExchangeType,
  InterviewSessionStatus,
  InterviewSessionType,
  RecordingMediaType,
  RecordingStatus,
)
from interviews.factories import (
  InterviewRecordingFactory,
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from interviews.models import InterviewRecording, InterviewSession
from interviews.services import InitiateRecordingService
from interviews.services.submit_answer_and_generate_followup_service import FollowupResult
from interviews.tasks.monitor_paused_sessions_task import MonitorPausedSessionsTask
from interviews.tasks.process_video_step_complete import process_video_step_complete
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory

BASE = "/api/v1/interviews"

MOCK_INITIATE_S3 = "interviews.services.initiate_recording_service.get_video_s3_client"
MOCK_COMPLETE_S3 = "interviews.services.complete_recording_service.get_video_s3_client"
MOCK_ABORT_S3 = "interviews.services.abort_recording_service.get_video_s3_client"
MOCK_TAKEOVER_S3 = "interviews.services.takeover_interview_session_service.get_video_s3_client"
MOCK_TAKEOVER_BROADCAST = "interviews.services.takeover_interview_session_service.get_channel_layer"
MOCK_FINISH_STREAK = "api.v1.interviews.views.finish_interview_view.StreakStatisticsService"
MOCK_FOLLOWUP_SERVICE = "api.v1.interviews.views.submit_answer_view.SubmitAnswerAndGenerateFollowupService"
MOCK_DISPATCH_TRANSCRIBE = "interviews.tasks.process_video_step_complete._dispatch_transcribe_audio"
MOCK_STORE_FACE = "interviews.tasks.process_video_step_complete._store_face_analysis_result"


class _LifecycleE2EBase(OwnershipHeadersMixin, TestCase):
  """FOLLOWUP 세션 lifecycle 시나리오 공통 setup.

  세션 타입은 FOLLOWUP (anchor 1 + followup 1 = expected total 2) 를 기본으로 사용한다.
  start view 는 우회하고 anchor turn 을 factory 로 직접 생성하여 LLM/Ticket 의존을 제거한다.
  """

  EXPECTED_TOTAL_QUESTIONS = FOLLOWUP_ANCHOR_COUNT * (1 + MAX_FOLLOWUP_PER_ANCHOR)

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=self.EXPECTED_TOTAL_QUESTIONS,
      total_followup_questions=0,
    )
    self.authenticate_with_ownership(self.user, self.session)
    self.anchor_turn = InterviewTurnFactory(
      interview_session=self.session,
      turn_type=InterviewExchangeType.INITIAL,
      turn_number=1,
      followup_order=None,
      answer="",
    )

  def _strip_owner_headers(self):
    refresh_token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh_token.access_token}")

  def _refresh_owner_headers_after_takeover(self, takeover_response):
    self.client.credentials(
      HTTP_AUTHORIZATION=self.client._credentials["HTTP_AUTHORIZATION"],
      HTTP_X_SESSION_OWNER_TOKEN=takeover_response.data["owner_token"],
      HTTP_X_SESSION_OWNER_VERSION=str(takeover_response.data["owner_version"]),
    )
    self.session.refresh_from_db()

  @staticmethod
  def _make_s3_mock_for_initiate(upload_id="upload-test"):
    mock_s3 = MagicMock()
    mock_s3.create_multipart_upload.return_value = {"UploadId": upload_id}
    return mock_s3

  @staticmethod
  def _make_s3_mock_for_complete():
    mock_s3 = MagicMock()
    mock_s3.complete_multipart_upload.return_value = {}
    return mock_s3

  @staticmethod
  def _make_s3_mock_for_abort():
    mock_s3 = MagicMock()
    mock_s3.abort_multipart_upload.return_value = {}
    return mock_s3

  def _api_initiate_recording(self, turn, upload_id="upload-test"):
    with patch(MOCK_INITIATE_S3, return_value=self._make_s3_mock_for_initiate(upload_id)):
      return self.client.post(
        f"{BASE}/interview-sessions/{self.session.uuid}/recordings/initiate/",
        data={
          "turn_id": turn.pk,
          "media_type": "video"
        },
        format="json",
      )

  def _api_complete_recording(self, recording_id):
    with patch(MOCK_COMPLETE_S3, return_value=self._make_s3_mock_for_complete()):
      return self.client.post(
        f"{BASE}/recordings/{recording_id}/complete/",
        data={
          "parts": [{
            "partNumber": 1,
            "etag": "etag-1"
          }],
          "endTimestamp": "2026-05-10T12:00:00Z",
          "durationMs": 5000,
        },
        format="json",
      )

  def _api_abort_recording(self, recording_id):
    with patch(MOCK_ABORT_S3, return_value=self._make_s3_mock_for_abort()):
      return self.client.post(f"{BASE}/recordings/{recording_id}/abort/")

  def _api_submit_answer(self, turn, *, answer="답변 내용", followup_turns=None, followup_exhausted=False):
    with patch(MOCK_FOLLOWUP_SERVICE) as mock_service_class:
      mock_service_class.return_value.perform.return_value = FollowupResult(
        turns=followup_turns or [],
        followup_exhausted=followup_exhausted,
      )
      return self.client.post(
        f"{BASE}/interview-sessions/{self.session.uuid}/turns/{turn.pk}/answer/",
        data={"answer": answer},
        format="json",
      )

  def _api_finish(self):
    with patch(MOCK_FINISH_STREAK) as mock_streak_class:
      mock_streak_class.return_value.record_participation = MagicMock()
      return self.client.post(f"{BASE}/interview-sessions/{self.session.uuid}/finish/")

  def _api_takeover(self):
    mock_channel_layer = MagicMock()
    mock_channel_layer.group_send = MagicMock(return_value=None)
    with (
      patch(MOCK_TAKEOVER_S3, return_value=self._make_s3_mock_for_abort()),
      patch(MOCK_TAKEOVER_BROADCAST, return_value=mock_channel_layer),
    ):
      response = self.client.post(f"{BASE}/interview-sessions/{self.session.uuid}/takeover/")
    if response.status_code == status.HTTP_200_OK:
      self._refresh_owner_headers_after_takeover(response)
    return response

  def _trigger_step_complete(self, recording, step, *, output_key=None, source_s3_key=None):
    """Lambda step-complete 시뮬레이션: process_video_step_complete task 직접 호출.

    audio_extractor 의 STT dispatch 와 face_analyzer 의 S3 fetch 후처리는 mock 한다.
    """
    if output_key is None:
      output_key = f"{step}/{recording.interview_turn_id}.out"
    if source_s3_key is None:
      source_s3_key = recording.s3_key

    with (
      patch(MOCK_DISPATCH_TRANSCRIBE),
      patch(MOCK_STORE_FACE),
    ):
      return process_video_step_complete.apply(
        kwargs={
          "session_uuid": str(recording.interview_session_id),
          "turn_id": str(recording.interview_turn_id),
          "step": step,
          "output_bucket": "test-bucket",
          "output_key": output_key,
          "source_s3_key": source_s3_key,
        }
      )

  def _trigger_all_steps_complete(self, recording):
    """4 step 모두 완료시켜 status 를 READY 로 만든다."""
    for step in ["video_converter", "frame_extractor", "audio_scaler", "face_analyzer"]:
      self._trigger_step_complete(recording, step)
    recording.refresh_from_db()
    return recording

  def _create_followup_turn_for(self, anchor):
    return InterviewTurnFactory(
      interview_session=self.session,
      turn_type=InterviewExchangeType.FOLLOWUP,
      turn_number=anchor.turn_number,
      followup_order=1,
      anchor_turn=anchor,
      answer="",
    )

  def _populate_remaining_turns_as_answered(self, *, skip_first_anchor_followup_order=None):
    """is_completion_eligible() 충족을 위해 setUp 외의 모든 turn 을 answered 로 일괄 생성.

    skip_first_anchor_followup_order 가 주어지면 첫 anchor 의 해당 followup_order 는 건너뛴다
    (시나리오에서 직접 만든 followup_turn 과 충돌 방지).
    """
    for anchor_idx in range(FOLLOWUP_ANCHOR_COUNT):
      if anchor_idx == 0:
        anchor = self.anchor_turn
      else:
        anchor = InterviewTurnFactory(
          interview_session=self.session,
          turn_type=InterviewExchangeType.INITIAL,
          turn_number=anchor_idx + 1,
          followup_order=None,
          answer=f"anchor-{anchor_idx + 1} 답변",
        )
      for followup_idx in range(MAX_FOLLOWUP_PER_ANCHOR):
        followup_order = followup_idx + 1
        if anchor_idx == 0 and followup_order == skip_first_anchor_followup_order:
          continue
        InterviewTurnFactory(
          interview_session=self.session,
          turn_type=InterviewExchangeType.FOLLOWUP,
          turn_number=anchor.turn_number,
          followup_order=followup_order,
          anchor_turn=anchor,
          answer=f"followup-{anchor_idx + 1}-{followup_order} 답변",
        )

  def _get_recording(self, recording_id):
    return InterviewRecording.objects.get(pk=recording_id)


class S1_FullCompletionHappyPathTests(_LifecycleE2EBase):
  """모든 질문에 답변하고 정상 finish 까지 완료하는 happy path."""

  def test_full_lifecycle_completes_session(self):
    """anchor 답변 + followup 생성 + followup 답변 + finish → 세션 COMPLETED."""
    initiate_anchor = self._api_initiate_recording(self.anchor_turn)
    self.assertEqual(initiate_anchor.status_code, status.HTTP_201_CREATED)
    anchor_recording_id = initiate_anchor.data["recording_id"]

    complete_anchor = self._api_complete_recording(anchor_recording_id)
    self.assertEqual(complete_anchor.status_code, status.HTTP_200_OK)

    anchor_recording = self._trigger_all_steps_complete(self._get_recording(anchor_recording_id))
    self.assertEqual(anchor_recording.status, RecordingStatus.READY)

    followup_turn = self._create_followup_turn_for(self.anchor_turn)
    submit_anchor = self._api_submit_answer(
      self.anchor_turn,
      followup_turns=[followup_turn],
      followup_exhausted=False,
    )
    self.assertEqual(submit_anchor.status_code, status.HTTP_201_CREATED)
    self.anchor_turn.refresh_from_db()
    self.anchor_turn.answer = "anchor 답변"
    self.anchor_turn.save(update_fields=["answer"])

    initiate_followup = self._api_initiate_recording(followup_turn)
    self.assertEqual(initiate_followup.status_code, status.HTTP_201_CREATED)
    followup_recording_id = initiate_followup.data["recording_id"]
    self._api_complete_recording(followup_recording_id)
    followup_recording = self._trigger_all_steps_complete(self._get_recording(followup_recording_id))
    self.assertEqual(followup_recording.status, RecordingStatus.READY)

    submit_followup = self._api_submit_answer(followup_turn, followup_exhausted=True)
    self.assertEqual(submit_followup.status_code, status.HTTP_201_CREATED)
    self.assertTrue(submit_followup.data["followup_exhausted"])
    followup_turn.refresh_from_db()
    followup_turn.answer = "followup 답변"
    followup_turn.save(update_fields=["answer"])

    self._populate_remaining_turns_as_answered(skip_first_anchor_followup_order=1)

    finish_response = self._api_finish()
    self.assertEqual(finish_response.status_code, status.HTTP_200_OK)
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.COMPLETED)

    ready_recordings = InterviewRecording.objects.filter(
      interview_session=self.session,
      status=RecordingStatus.READY,
    )
    self.assertEqual(ready_recordings.count(), 2)


class S2_ExitDuringFirstQuestionTests(_LifecycleE2EBase):
  """첫 질문 녹화 시작 후 답변 없이 이탈."""

  def test_initiate_then_abort_marks_recording_failed_and_keeps_turn_unanswered(self):
    """initiate → abort 후 recording=FAILED, turn 미답변, session IN_PROGRESS 유지."""
    initiate_response = self._api_initiate_recording(self.anchor_turn)
    self.assertEqual(initiate_response.status_code, status.HTTP_201_CREATED)
    recording_id = initiate_response.data["recording_id"]

    abort_response = self._api_abort_recording(recording_id)
    self.assertEqual(abort_response.status_code, status.HTTP_204_NO_CONTENT)

    recording = self._get_recording(recording_id)
    self.assertEqual(recording.status, RecordingStatus.FAILED)

    self.anchor_turn.refresh_from_db()
    self.assertEqual(self.anchor_turn.answer, "")

    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_finish_blocked_when_user_exits_without_answering(self):
    """답변 없이 finish 시도 → 400 INTERVIEW_NOT_COMPLETED."""
    finish_response = self._api_finish()
    self.assertEqual(finish_response.status_code, status.HTTP_400_BAD_REQUEST)
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)


class S3_ExitDuringFollowupQuestionTests(_LifecycleE2EBase):
  """첫 질문은 답변 완료, 꼬리질문 녹화 도중 이탈."""

  def test_anchor_answered_followup_recording_aborted(self):
    """anchor READY + answered, followup recording FAILED, followup turn 미답변."""
    initiate_anchor = self._api_initiate_recording(self.anchor_turn)
    anchor_recording_id = initiate_anchor.data["recording_id"]
    self._api_complete_recording(anchor_recording_id)
    self._trigger_all_steps_complete(self._get_recording(anchor_recording_id))

    followup_turn = self._create_followup_turn_for(self.anchor_turn)
    self._api_submit_answer(self.anchor_turn, followup_turns=[followup_turn], followup_exhausted=False)
    self.anchor_turn.refresh_from_db()
    self.anchor_turn.answer = "anchor 답변"
    self.anchor_turn.save(update_fields=["answer"])

    initiate_followup = self._api_initiate_recording(followup_turn)
    followup_recording_id = initiate_followup.data["recording_id"]

    abort_response = self._api_abort_recording(followup_recording_id)
    self.assertEqual(abort_response.status_code, status.HTTP_204_NO_CONTENT)

    anchor_recording = self._get_recording(anchor_recording_id)
    followup_recording = self._get_recording(followup_recording_id)
    self.assertEqual(anchor_recording.status, RecordingStatus.READY)
    self.assertEqual(followup_recording.status, RecordingStatus.FAILED)

    followup_turn.refresh_from_db()
    self.assertEqual(followup_turn.answer, "")

    finish_response = self._api_finish()
    self.assertEqual(finish_response.status_code, status.HTTP_400_BAD_REQUEST)


class S4_AllAnsweredButNoFinishTests(_LifecycleE2EBase):
  """모든 turn 답변했지만 사용자가 finish 안 누르고 이탈한 상태."""

  def _answer_all_turns_and_complete_recordings(self):
    initiate_anchor = self._api_initiate_recording(self.anchor_turn)
    anchor_recording_id = initiate_anchor.data["recording_id"]
    self._api_complete_recording(anchor_recording_id)
    self._trigger_all_steps_complete(self._get_recording(anchor_recording_id))

    followup_turn = self._create_followup_turn_for(self.anchor_turn)
    self._api_submit_answer(self.anchor_turn, followup_turns=[followup_turn], followup_exhausted=False)
    self.anchor_turn.refresh_from_db()
    self.anchor_turn.answer = "anchor 답변"
    self.anchor_turn.save(update_fields=["answer"])

    initiate_followup = self._api_initiate_recording(followup_turn)
    followup_recording_id = initiate_followup.data["recording_id"]
    self._api_complete_recording(followup_recording_id)
    self._trigger_all_steps_complete(self._get_recording(followup_recording_id))

    self._api_submit_answer(followup_turn, followup_exhausted=True)
    followup_turn.refresh_from_db()
    followup_turn.answer = "followup 답변"
    followup_turn.save(update_fields=["answer"])

    self._populate_remaining_turns_as_answered(skip_first_anchor_followup_order=1)

    return followup_turn

  def test_session_remains_in_progress_until_explicit_finish(self):
    """모든 답변 완료해도 명시적 finish 가 없으면 세션은 IN_PROGRESS 그대로."""
    self._answer_all_turns_and_complete_recordings()

    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)
    self.assertTrue(self.session.is_completion_eligible())

  def test_monitor_task_finalizes_long_paused_eligible_session(self):
    """이탈 → 30 분 이상 PAUSED → monitor task 가 자동 COMPLETED."""
    self._answer_all_turns_and_complete_recordings()

    self.session.mark_paused(reason="heartbeat_timeout")
    InterviewSession.objects.filter(pk=self.session.pk
                                    ).update(paused_at=timezone.now() - timezone.timedelta(minutes=45), )

    result = MonitorPausedSessionsTask().run()

    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.COMPLETED)
    self.assertEqual(result["long_paused_auto_finished"], 1)


class S5_SoftPauseResumeTests(_LifecycleE2EBase):
  """탭 전환 등 soft 이탈은 recording 을 보존한다."""

  def test_pause_blocks_mutate_then_resume_allows_progress(self):
    """PAUSED 동안 initiate/complete/abort 는 거부, resume 후 정상 진행."""
    self.session.mark_paused(reason="user_left_window")
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.PAUSED)

    paused_initiate = self._api_initiate_recording(self.anchor_turn)
    self.assertEqual(paused_initiate.status_code, status.HTTP_400_BAD_REQUEST)

    self.session.mark_resumed()
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

    resumed_initiate = self._api_initiate_recording(self.anchor_turn)
    self.assertEqual(resumed_initiate.status_code, status.HTTP_201_CREATED)
    recording = self._get_recording(resumed_initiate.data["recording_id"])
    self.assertEqual(recording.status, RecordingStatus.INITIATED)

  def test_existing_recording_survives_pause_resume(self):
    """initiate 후 pause/resume 에도 같은 recording 으로 이어 complete 가능."""
    initiate_response = self._api_initiate_recording(self.anchor_turn)
    recording_id = initiate_response.data["recording_id"]

    self.session.mark_paused(reason="user_left_window")
    self.session.mark_resumed()
    self.session.refresh_from_db()

    complete_response = self._api_complete_recording(recording_id)
    self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
    recording = self._get_recording(recording_id)
    self.assertEqual(recording.status, RecordingStatus.COMPLETED)


class S6_HardExitAndTakeoverTests(_LifecycleE2EBase):
  """창 닫기 후 재진입 — takeover 로 이전 active recording 폐기 후 새로 시작."""

  def test_takeover_abandons_active_recording_and_allows_new_initiate(self):
    """takeover 후 이전 INITIATED 는 ABANDONED, 같은 turn 에 새 INITIATED 가능."""
    initiate_response = self._api_initiate_recording(self.anchor_turn)
    first_recording_id = initiate_response.data["recording_id"]
    first_recording = self._get_recording(first_recording_id)
    self.assertEqual(first_recording.status, RecordingStatus.INITIATED)

    takeover_response = self._api_takeover()
    self.assertEqual(takeover_response.status_code, status.HTTP_200_OK)

    first_recording.refresh_from_db()
    self.assertEqual(first_recording.status, RecordingStatus.ABANDONED)

    second_initiate = self._api_initiate_recording(self.anchor_turn)
    self.assertEqual(second_initiate.status_code, status.HTTP_201_CREATED)
    second_recording_id = second_initiate.data["recording_id"]
    self.assertNotEqual(first_recording_id, second_recording_id)

    second_recording = self._get_recording(second_recording_id)
    self.assertEqual(second_recording.status, RecordingStatus.INITIATED)

    active_count = InterviewRecording.objects.filter(
      interview_session=self.session,
      interview_turn=self.anchor_turn,
    ).exclude(status=RecordingStatus.ABANDONED).count()
    self.assertEqual(active_count, 1)


class S7_DelayedLambdaAfterTakeoverTests(_LifecycleE2EBase):
  """takeover 직후 옛 recording 의 step-complete 가 늦게 도착하는 경우 처리."""

  def test_delayed_step_complete_for_abandoned_recording_does_not_corrupt_active(self):
    """업로드 도중 takeover → 새 recording 의 step-complete 만 반영, ABANDONED 된 옛 recording 은 그대로."""
    first_initiate = self._api_initiate_recording(self.anchor_turn)
    first_recording = self._get_recording(first_initiate.data["recording_id"])

    self._api_takeover()
    first_recording.refresh_from_db()
    self.assertEqual(first_recording.status, RecordingStatus.ABANDONED)

    second_initiate = self._api_initiate_recording(self.anchor_turn)
    second_recording = self._get_recording(second_initiate.data["recording_id"])
    self._api_complete_recording(second_recording.pk)
    self._trigger_step_complete(second_recording, "video_converter", output_key="new/video.mp4")

    second_recording.refresh_from_db()
    self.assertEqual(second_recording.scaled_video_key, "new/video.mp4")

    with patch("interviews.tasks.process_video_step_complete._send_dispatch_failure_alert"):
      self._trigger_step_complete(
        first_recording,
        "video_converter",
        output_key="old/video.mp4",
        source_s3_key=first_recording.s3_key,
      )

    first_recording.refresh_from_db()
    second_recording.refresh_from_db()
    self.assertEqual(first_recording.scaled_video_key, "")
    self.assertEqual(second_recording.scaled_video_key, "new/video.mp4")

  def test_step_complete_with_correct_source_key_targets_correct_recording(self):
    """동일 turn 에 abandoned + active 가 공존해도 source_s3_key 기준으로 정확 매칭."""
    abandoned = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.anchor_turn,
      user=self.user,
      status=RecordingStatus.ABANDONED,
      s3_key=f"{self.session.pk}/{self.anchor_turn.pk}/old.webm",
    )

    initiate_response = self._api_initiate_recording(self.anchor_turn)
    new_recording = self._get_recording(initiate_response.data["recording_id"])
    self._api_complete_recording(new_recording.pk)

    self._trigger_step_complete(new_recording, "frame_extractor", output_key="frames/")

    new_recording.refresh_from_db()
    abandoned.refresh_from_db()
    self.assertEqual(new_recording.frame_prefix, "frames/")
    self.assertEqual(abandoned.frame_prefix, "")


class S8_ConcurrentInitiateConflictTests(_LifecycleE2EBase):
  """같은 turn 에 active recording 이 이미 있으면 새 initiate 는 ConflictException."""

  def test_initiate_when_completed_active_recording_exists_raises_conflict(self):
    """COMPLETED 도 active 이므로 같은 turn 에 새 INITIATED 시도 → ConflictException."""
    InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.anchor_turn,
      user=self.user,
      status=RecordingStatus.COMPLETED,
      s3_key=f"{self.session.pk}/{self.anchor_turn.pk}/already.webm",
    )

    with patch(MOCK_INITIATE_S3, return_value=self._make_s3_mock_for_initiate()):
      with self.assertRaises(ConflictException):
        with transaction.atomic():
          InitiateRecordingService(
            interview_session=self.session,
            interview_turn=self.anchor_turn,
            user=self.user,
            media_type=RecordingMediaType.VIDEO,
          ).perform()

    active_count = InterviewRecording.objects.filter(interview_turn=self.anchor_turn, ).exclude(
      status=RecordingStatus.ABANDONED
    ).count()
    self.assertEqual(active_count, 1)

  def test_repeated_initiate_via_api_replaces_stale_active_recording(self):
    """initiate 가 두 번 호출되면 첫번째는 ABANDONED 처리되고 두번째가 새 active 가 된다."""
    first_response = self._api_initiate_recording(self.anchor_turn)
    self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)

    second_response = self._api_initiate_recording(self.anchor_turn)
    self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)

    first_recording = self._get_recording(first_response.data["recording_id"])
    second_recording = self._get_recording(second_response.data["recording_id"])
    self.assertEqual(first_recording.status, RecordingStatus.ABANDONED)
    self.assertEqual(second_recording.status, RecordingStatus.INITIATED)


class S9_FourStepReadyTransitionTests(_LifecycleE2EBase):
  """video_converter / frame_extractor / audio_scaler / face_analyzer 가 모두 도착해야 READY."""

  def test_partial_steps_keep_status_processing(self):
    """4 step 중 3 개만 도착하면 status 는 PROCESSING / 4 개 모두여야 READY."""
    initiate_response = self._api_initiate_recording(self.anchor_turn)
    recording_id = initiate_response.data["recording_id"]
    self._api_complete_recording(recording_id)
    recording = self._get_recording(recording_id)
    self.assertEqual(recording.status, RecordingStatus.COMPLETED)

    for step in ["video_converter", "frame_extractor", "audio_scaler"]:
      self._trigger_step_complete(recording, step)
    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.PROCESSING)

    self._trigger_step_complete(recording, "face_analyzer")
    recording.refresh_from_db()
    self.assertEqual(recording.status, RecordingStatus.READY)


class S10_PausedSessionGuardTests(_LifecycleE2EBase):
  """PAUSED 세션에 대한 mutate API 호출은 ValidationException(400)."""

  def setUp(self):
    super().setUp()
    self.recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.anchor_turn,
      user=self.user,
      status=RecordingStatus.UPLOADING,
      s3_key=f"{self.session.pk}/{self.anchor_turn.pk}/active.webm",
    )
    self.session.mark_paused(reason="user_left_window")
    self.session.refresh_from_db()

  def test_initiate_on_paused_session_returns_400(self):
    response = self._api_initiate_recording(self.anchor_turn)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_complete_on_paused_session_returns_400(self):
    response = self._api_complete_recording(self.recording.pk)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_abort_on_paused_session_returns_400(self):
    response = self._api_abort_recording(self.recording.pk)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_submit_answer_on_paused_session_returns_400(self):
    response = self._api_submit_answer(self.anchor_turn)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class S11_PartialCompletionFinishRejectionTests(_LifecycleE2EBase):
  """필수 turn 답변이 끝나지 않은 채로 finish 호출 시 거부."""

  def test_finish_with_unanswered_anchor_returns_400(self):
    """anchor 답변 없이 finish → 400 INTERVIEW_NOT_COMPLETED."""
    response = self._api_finish()
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    error_code = response.data.get("errorCode") or response.data.get("error_code")
    self.assertEqual(error_code, "INTERVIEW_NOT_COMPLETED")
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_finish_with_unanswered_followup_returns_400(self):
    """anchor 만 답변, followup 답변 안 한 상태 finish → 400."""
    self.anchor_turn.answer = "anchor 답변"
    self.anchor_turn.save(update_fields=["answer"])
    self._create_followup_turn_for(self.anchor_turn)

    response = self._api_finish()
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)


class S12_LongPausedNotEligibleTests(_LifecycleE2EBase):
  """PAUSED 30 분 초과여도 답변이 부족하면 COMPLETED 로 전환되지 않는다."""

  def test_long_paused_unanswered_session_remains_paused(self):
    """anchor 답변 없이 30 분 초과 PAUSED → monitor task 가 finish 시도하지만 ineligible 로 PAUSED 유지."""
    self.session.mark_paused(reason="heartbeat_timeout")
    InterviewSession.objects.filter(pk=self.session.pk
                                    ).update(paused_at=timezone.now() - timezone.timedelta(minutes=45), )

    result = MonitorPausedSessionsTask().run()

    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.PAUSED)
    self.assertEqual(result["long_paused_auto_finished"], 0)


class S13_HeartbeatTimeoutTests(_LifecycleE2EBase):
  """IN_PROGRESS 세션이 heartbeat timeout 되면 monitor task 가 PAUSED 로 전환한다."""

  def test_heartbeat_timeout_marks_in_progress_session_as_paused(self):
    """last_heartbeat_at 이 cutoff 이전이면 자동 PAUSED."""
    InterviewSession.objects.filter(pk=self.session.pk
                                    ).update(last_heartbeat_at=timezone.now() - timezone.timedelta(minutes=5), )

    result = MonitorPausedSessionsTask().run()

    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.PAUSED)
    self.assertEqual(self.session.pause_reason, "heartbeat_timeout")
    self.assertEqual(result["heartbeat_timeout_paused"], 1)


class S14_TakeoverOwnershipRotationTests(_LifecycleE2EBase):
  """takeover 가 owner_version 을 증가시키고 새 token hash 를 cache 에 저장한다."""

  def test_takeover_rotates_owner_token_and_invalidates_old(self):
    """takeover 후 옛 owner_version 헤더로는 mutate API 호출 시 409."""
    old_owner_token = self.TEST_OWNER_TOKEN
    old_owner_version = self.TEST_OWNER_VERSION

    takeover_response = self._api_takeover()
    self.assertEqual(takeover_response.status_code, status.HTTP_200_OK)
    new_owner_version = takeover_response.data["owner_version"]
    self.assertGreater(new_owner_version, old_owner_version)

    refresh_token = RefreshToken.for_user(self.user)
    self.client.credentials(
      HTTP_AUTHORIZATION=f"Bearer {refresh_token.access_token}",
      HTTP_X_SESSION_OWNER_TOKEN=old_owner_token,
      HTTP_X_SESSION_OWNER_VERSION=str(old_owner_version),
    )

    response = self._api_initiate_recording(self.anchor_turn)
    self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
    error_code = response.data.get("errorCode") or response.data.get("error_code")
    self.assertEqual(error_code, "SESSION_OWNER_CHANGED")


class S15_StepCompleteForAbandonedRecordingTests(_LifecycleE2EBase):
  """ABANDONED 된 recording 의 step-complete 메시지는 NotFoundException 으로 raise 된다.

  process_video_step_complete task 가 raise 하므로 .apply() 결과의 successful 가 False.
  Backend 가 alert 를 보내고 retry 정책에 따라 SQS dead-letter 로 처리되도록 두는 것이 기대 동작.
  """

  def test_step_complete_for_abandoned_recording_raises_not_found(self):
    """ABANDONED recording 의 source_s3_key 로 step-complete → task 실패."""
    abandoned_recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.anchor_turn,
      user=self.user,
      status=RecordingStatus.ABANDONED,
      s3_key=f"{self.session.pk}/{self.anchor_turn.pk}/old-abandoned.webm",
    )

    with patch("interviews.tasks.process_video_step_complete._send_dispatch_failure_alert"):
      result = self._trigger_step_complete(
        abandoned_recording,
        "video_converter",
        output_key="should-not-be-applied.mp4",
      )

    self.assertFalse(result.successful())
    abandoned_recording.refresh_from_db()
    self.assertEqual(abandoned_recording.scaled_video_key, "")


class S16_TakeoverCacheInvalidationTests(_LifecycleE2EBase):
  """takeover 가 cache 에 새 token 을 저장하고 db 의 token_hash 도 갱신한다."""

  def test_takeover_persists_new_token_hash_in_db(self):
    takeover_response = self._api_takeover()
    new_token = takeover_response.data["owner_token"]

    self.session.refresh_from_db()
    expected_hash = hashlib.sha256(new_token.encode()).hexdigest()
    self.assertEqual(self.session.owner_token_hash, expected_hash)

  def test_takeover_returns_consistent_token_with_db_hash(self):
    """response 의 owner_token 을 hash 한 값이 db 의 owner_token_hash 와 일치한다."""
    takeover_response = self._api_takeover()
    new_token = takeover_response.data["owner_token"]
    new_version = takeover_response.data["owner_version"]

    self.session.refresh_from_db()
    self.assertEqual(
      self.session.owner_token_hash,
      hashlib.sha256(new_token.encode()).hexdigest(),
    )
    self.assertEqual(self.session.owner_version, new_version)
