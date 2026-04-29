"""analysis-stt worker 의 STT 결과를 InterviewTurn 에 저장하는 callback Celery 태스크."""

from __future__ import annotations

import structlog
from common.tasks.base_task import BaseTask
from config.celery import app
from interviews.enums import TranscriptSource, TranscriptStatus
from interviews.models import InterviewTurn

logger = structlog.get_logger(__name__)


class SaveTranscriptResultTask(BaseTask):
  """analysis-stt 의 STT 결과 (text + segments) 를 InterviewTurn.transcript_text 에 저장한다."""

  def run(
    self,
    turn_id: int,
    transcript_text: str,
    speech_segments: list[dict] | None = None,
    language: str = "",
    duration_ms: int = 0,
    error_code: str = "",
  ):
    try:
      turn = InterviewTurn.objects.get(pk=turn_id)
    except InterviewTurn.DoesNotExist:
      logger.error("save_transcript_turn_not_found", turn_id=turn_id)
      return {"status": "turn_not_found"}

    if error_code:
      turn.transcript_status = TranscriptStatus.FAILED
      turn.transcript_error_code = error_code
      turn.save(update_fields=["transcript_status", "transcript_error_code"])
      return {"status": "failed", "error_code": error_code}

    turn.transcript_text = transcript_text
    turn.speech_segments = speech_segments or []
    turn.transcript_status = TranscriptStatus.COMPLETED
    turn.transcript_source = TranscriptSource.BACKEND_STT
    turn.transcript_error_code = ""
    turn.save(
      update_fields=[
        "transcript_text",
        "speech_segments",
        "transcript_status",
        "transcript_source",
        "transcript_error_code",
      ]
    )
    logger.info(
      "save_transcript_completed",
      turn_id=turn_id,
      language=language,
      duration_ms=duration_ms,
      char_count=len(transcript_text),
    )
    return {"status": "completed", "turn_id": turn_id}


RegisteredSaveTranscriptResultTask = app.register_task(SaveTranscriptResultTask())
