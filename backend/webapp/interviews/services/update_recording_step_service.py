import logging

from common.exceptions import NotFoundException
from common.services import BaseService
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording

logger = logging.getLogger(__name__)

STEP_FIELDS = frozenset(
  {"scaled_video_key", "frame_prefix", "audio_key", "scaled_audio_key", "face_analysis_result_key"}
)

# 한 turn 에서 active 으로 간주할 status 들 (ABANDONED 와 FAILED 는 제외).
# Lambda 의 step-complete 메시지가 ABANDONED 된 옛 recording 을 잘못 갱신하는 것을 방지.
_ACTIVE_STATUSES = (
  RecordingStatus.INITIATED,
  RecordingStatus.UPLOADING,
  RecordingStatus.COMPLETED,
  RecordingStatus.PROCESSING,
  RecordingStatus.READY,
)


class UpdateRecordingStepService(BaseService):
  """Lambda 단계별 완료 이벤트를 받아 InterviewRecording의 해당 필드를 갱신한다.

    4개 필드(scaled_video_key, frame_prefix, audio_key, scaled_audio_key)가
    모두 채워지면 status를 READY로 전환한다.

    조회 우선순위:
      1) source_s3_key (Lambda 가 원본 .webm S3 key 를 그대로 전달) — 가장 정확
      2) (session, turn) + active status — fallback (옛 메시지 호환)

    1:1 정책: turn 당 active recording 은 1개만 허용 (DB partial unique constraint).
    fallback 경로에서도 .order_by('-created_at').first() 로 가장 최신 active 한 건 선택.
    """

  required_value_kwargs = ["session_uuid", "turn_id", "field_name", "output_key"]

  def validate(self):
    if self.kwargs["field_name"] not in STEP_FIELDS:
      raise ValueError(f"Invalid field_name: {self.kwargs['field_name']}")

    self._recording = self._lookup_recording()
    if self._recording is None:
      raise NotFoundException("해당 녹화 레코드를 찾을 수 없습니다.")

  def _lookup_recording(self):
    """source_s3_key 우선, 없으면 (session, turn, active status) fallback."""
    source_key = self.kwargs.get("source_s3_key", "") or ""

    if source_key:
      recording = InterviewRecording.objects.filter(
        s3_key=source_key,
        interview_session_id=self.kwargs["session_uuid"],
        interview_turn_id=self.kwargs["turn_id"],
        status__in=_ACTIVE_STATUSES,
      ).first()
      if recording is not None:
        return recording

      # source_key 가 왔는데도 못 찾으면 ABANDONED/FAILED 일 수 있음.
      # 그 경우는 정상적인 무시 케이스 (takeover 등으로 폐기됨) — 경고 후 None.
      logger.warning(
        "step_complete_for_unknown_recording",
        extra={
          "source_s3_key": source_key,
          "session_uuid": self.kwargs["session_uuid"],
          "turn_id": self.kwargs["turn_id"],
          "field_name": self.kwargs["field_name"],
        },
      )
      return None

    # fallback: 옛 Lambda 메시지 (source_s3_key 없음). active 한 가장 최신 건 선택.
    logger.info(
      "step_complete_fallback_lookup",
      extra={
        "session_uuid": self.kwargs["session_uuid"],
        "turn_id": self.kwargs["turn_id"],
        "field_name": self.kwargs["field_name"],
      },
    )
    return InterviewRecording.objects.filter(
      interview_session_id=self.kwargs["session_uuid"],
      interview_turn_id=self.kwargs["turn_id"],
      status__in=_ACTIVE_STATUSES,
    ).order_by("-created_at").first()

  def execute(self):
    recording = InterviewRecording.objects.select_for_update().get(pk=self._recording.pk)
    field_name = self.kwargs["field_name"]
    output_key = self.kwargs["output_key"]

    setattr(recording, field_name, output_key)
    update_fields = [field_name]

    if recording.status == RecordingStatus.COMPLETED:
      recording.status = RecordingStatus.PROCESSING
      update_fields.append("status")

    recording.save(update_fields=update_fields)

    if self._all_steps_complete(recording):
      recording.status = RecordingStatus.READY
      recording.save(update_fields=["status"])
      logger.info(
        "All steps complete: session=%s turn=%s",
        self.kwargs["session_uuid"],
        self.kwargs["turn_id"],
      )

    return recording

  @staticmethod
  def _all_steps_complete(recording: InterviewRecording) -> bool:
    return all(
      [
        recording.scaled_video_key,
        recording.frame_prefix,
        recording.scaled_audio_key,
        recording.face_analysis_result_key,
      ]
    )
