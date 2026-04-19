import logging

from config.celery_sqs import app
from interviews.services import UpdateRecordingStepService

logger = logging.getLogger(__name__)

STEP_FIELD_MAP = {
  "video_converter": "scaled_video_key",
  "frame_extractor": "frame_prefix",
  "audio_extractor": "scaled_audio_key",
}


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
