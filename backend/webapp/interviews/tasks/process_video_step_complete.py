import logging

from config.celery_sqs import app
from interviews.enums import TranscriptStatus
from interviews.models import InterviewTurn
from interviews.services import UpdateRecordingStepService

logger = logging.getLogger(__name__)

STEP_FIELD_MAP = {
  "video_converter": "scaled_video_key",
  "frame_extractor": "frame_prefix",
  "audio_extractor": "audio_key",
  "audio_scaler": "scaled_audio_key",
}


def _dispatch_transcribe_audio(turn_id: str, output_bucket: str, output_key: str) -> None:
  """audio_extractor 완료 시 analysis-stt worker 에 STT 작업 디스패치."""
  if not turn_id or not output_bucket or not output_key:
    logger.warning(
      "skip_transcribe_dispatch_missing_arg",
      turn_id=turn_id,
      output_bucket=output_bucket,
      output_key=output_key,
    )
    return

  try:
    InterviewTurn.objects.filter(pk=turn_id).update(transcript_status=TranscriptStatus.PENDING)
    app.send_task(
      "transcribe_audio",
      kwargs={
        "turn_id": int(turn_id),
        "audio_bucket": output_bucket,
        "audio_key": output_key,
      },
      queue="analysis-stt",
    )
    logger.info("transcribe_audio_dispatched", turn_id=turn_id)
  except Exception:
    logger.exception("transcribe_audio_dispatch_failed", turn_id=turn_id)


@app.task(name="interviews.tasks.process_video_step_complete.process_video_step_complete")
def process_video_step_complete(
  session_uuid: str = "",
  turn_id: str = "",
  step: str = "",
  output_bucket: str = "",
  output_key: str = "",
  **kwargs,
):
  if step not in STEP_FIELD_MAP:
    logger.warning("Unknown step: %s", step)
    return

  field_name = STEP_FIELD_MAP[step]

  try:
    UpdateRecordingStepService(
      session_uuid=session_uuid,
      turn_id=turn_id,
      field_name=field_name,
      output_key=output_key,
    ).perform()
    logger.info("Step complete: session=%s turn=%s step=%s", session_uuid, turn_id, step)
  except Exception:
    logger.exception(
      "Failed to process step: session=%s turn=%s step=%s",
      session_uuid,
      turn_id,
      step,
    )
    raise

  if step == "audio_extractor":
    _dispatch_transcribe_audio(turn_id=turn_id, output_bucket=output_bucket, output_key=output_key)
