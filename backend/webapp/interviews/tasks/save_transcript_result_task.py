"""analysis-stt worker 의 STT 결과를 InterviewTurn 에 저장하는 callback Celery 태스크.

STT 가 모두 완료되면 (사용자가 미리 요청해 둔) PENDING 상태의 분석 리포트를 자동 dispatch.
사용자는 STT 진행 여부와 무관하게 "리포트 생성" 버튼을 누를 수 있고,
백엔드 상태 관리만으로 LLM 분석은 STT 가 완료된 시점에 시작된다.
"""

from __future__ import annotations

import structlog
from common.tasks.base_task import BaseTask
from config.celery import app
from interviews.enums import InterviewAnalysisReportStatus, TranscriptSource, TranscriptStatus
from interviews.models import InterviewAnalysisReport, InterviewTurn

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
      turn = InterviewTurn.objects.select_related("interview_session").get(pk=turn_id)
    except InterviewTurn.DoesNotExist:
      logger.error("save_transcript_turn_not_found", turn_id=turn_id)
      return {"status": "turn_not_found"}

    if error_code:
      turn.transcript_status = TranscriptStatus.FAILED
      turn.transcript_error_code = error_code
      turn.save(update_fields=["transcript_status", "transcript_error_code"])
      _try_dispatch_pending_report(turn.interview_session)
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
    _try_dispatch_pending_report(turn.interview_session)
    return {"status": "completed", "turn_id": turn_id}


def _try_dispatch_pending_report(interview_session) -> None:
  try:
    report = InterviewAnalysisReport.objects.filter(
      interview_session=interview_session,
      interview_analysis_report_status=InterviewAnalysisReportStatus.PENDING,
    ).first()
    if not report:
      return

    from interviews.services.regenerate_analysis_report_service import dispatch_report_if_ready
    dispatched = dispatch_report_if_ready(report)
    if dispatched:
      logger.info(
        "auto_dispatch_report_after_stt",
        report_id=report.pk,
        session_id=interview_session.pk,
      )
  except Exception:
    logger.exception(
      "auto_dispatch_report_failed",
      session_id=getattr(interview_session, "pk", None),
    )


RegisteredSaveTranscriptResultTask = app.register_task(SaveTranscriptResultTask())
