from common.exceptions import NotFoundException
from common.services import BaseService
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording


class UpdateRecordingStatusService(BaseService):
  """비디오 처리 완료 알림을 받아 녹화 레코드 상태와 파일 키를 갱신한다."""

  required_value_kwargs = ["session_uuid", "turn_id", "status"]

  def validate(self):
    session_uuid = self.kwargs["session_uuid"]
    turn_id = self.kwargs["turn_id"]

    try:
      self._recording = InterviewRecording.objects.select_related("interview_session").get(
        interview_session_id=session_uuid,
        interview_turn_id=turn_id,
      )
    except InterviewRecording.DoesNotExist:
      raise NotFoundException("해당 녹화 레코드를 찾을 수 없습니다.")

  def execute(self):
    recording = self._recording
    status_value = self.kwargs["status"]

    recording.status = RecordingStatus(status_value)

    update_fields = ["status"]

    scaled_video_key = self.kwargs.get("scaled_video_key", "")
    if scaled_video_key:
      recording.scaled_video_key = scaled_video_key
      update_fields.append("scaled_video_key")

    audio_key = self.kwargs.get("audio_key", "")
    if audio_key:
      recording.audio_key = audio_key
      update_fields.append("audio_key")

    scaled_audio_key = self.kwargs.get("scaled_audio_key", "")
    if scaled_audio_key:
      recording.scaled_audio_key = scaled_audio_key
      update_fields.append("scaled_audio_key")

    frame_prefix = self.kwargs.get("frame_prefix", "")
    if frame_prefix:
      recording.frame_prefix = frame_prefix
      update_fields.append("frame_prefix")

    recording.save(update_fields=update_fields)

    return recording
