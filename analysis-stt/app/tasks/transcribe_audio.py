"""S3 audio key 를 받아 STT 후 backend 의 save_transcript_result_task 로 결과 콜백."""

import logging
import os

from app import config
from app.celery_app import app
from app.services.s3_downloader import download_audio_to_tempfile
from app.services.transcriber import transcribe_local_file

logger = logging.getLogger(__name__)


@app.task(name="transcribe_audio", bind=True, max_retries=3, default_retry_delay=30)
def transcribe_audio(
  self,
  turn_id: int,
  audio_bucket: str,
  audio_key: str,
  language: str = "",
  prompt: str | None = None,
):
  """audio_bucket / audio_key 로 다운로드 → faster-whisper STT → backend callback."""
  effective_language = language or config.STT_DEFAULT_LANGUAGE
  audio_path: str | None = None

  try:
    audio_path = download_audio_to_tempfile(audio_bucket, audio_key)
    result = transcribe_local_file(audio_path, language=effective_language, prompt=prompt)
  except Exception as exc:
    logger.exception("transcribe_audio_failed turn_id=%s key=%s", turn_id, audio_key)
    _send_failure_callback(turn_id=turn_id, error_code=type(exc).__name__)
    raise self.retry(exc=exc)
  finally:
    if audio_path and os.path.exists(audio_path):
      os.remove(audio_path)

  _send_success_callback(
    turn_id=turn_id,
    transcript_text=result.get("text", ""),
    speech_segments=result.get("segments", []),
    language=result.get("language", effective_language),
    duration_ms=int(result.get("duration_ms", 0)),
  )

  return {
    "status": "completed",
    "turn_id": turn_id,
    "language": result.get("language"),
    "duration_ms": result.get("duration_ms"),
    "char_count": len(result.get("text", "")),
  }


def _send_success_callback(
  *,
  turn_id: int,
  transcript_text: str,
  speech_segments: list[dict],
  language: str,
  duration_ms: int,
) -> None:
  app.send_task(
    config.BACKEND_CALLBACK_TASK_NAME,
    kwargs={
      "turn_id": turn_id,
      "transcript_text": transcript_text,
      "speech_segments": speech_segments,
      "language": language,
      "duration_ms": duration_ms,
    },
    queue=config.BACKEND_CALLBACK_QUEUE,
  )


def _send_failure_callback(*, turn_id: int, error_code: str) -> None:
  app.send_task(
    config.BACKEND_CALLBACK_TASK_NAME,
    kwargs={
      "turn_id": turn_id,
      "transcript_text": "",
      "speech_segments": [],
      "language": "",
      "duration_ms": 0,
      "error_code": error_code,
    },
    queue=config.BACKEND_CALLBACK_QUEUE,
  )
