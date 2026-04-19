import logging

from common.exceptions import NotFoundException
from common.services import BaseService
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording

logger = logging.getLogger(__name__)

STEP_FIELDS = frozenset({"scaled_video_key", "frame_prefix", "audio_key", "scaled_audio_key"})


class UpdateRecordingStepService(BaseService):
  """Lambda 단계별 완료 이벤트를 받아 InterviewRecording의 해당 필드를 갱신한다.

    4개 필드(scaled_video_key, frame_prefix, audio_key, scaled_audio_key)가
    모두 채워지면 status를 READY로 전환한다.
    """

  required_value_kwargs = ["session_uuid", "turn_id", "field_name", "output_key"]

  def validate(self):
    if self.kwargs["field_name"] not in STEP_FIELDS:
      raise ValueError(f"Invalid field_name: {self.kwargs['field_name']}")

    try:
      self._recording = InterviewRecording.objects.get(
        interview_session_id=self.kwargs["session_uuid"],
        interview_turn_id=self.kwargs["turn_id"],
      )
    except InterviewRecording.DoesNotExist:
      raise NotFoundException("해당 녹화 레코드를 찾을 수 없습니다.")

  def execute(self):
    recording = self._recording
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
    return all([
      recording.scaled_video_key,
      recording.frame_prefix,
      recording.audio_key,
      recording.scaled_audio_key,
    ])
