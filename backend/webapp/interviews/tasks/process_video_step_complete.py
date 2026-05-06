import traceback as tb_module

import structlog
from common.tasks.send_error_alert_task import RegisteredSendErrorAlertTask
from config.celery import app as redis_app
from config.celery_sqs import app
from interviews.enums import TranscriptStatus
from interviews.models import InterviewTurn
from interviews.services import UpdateRecordingStepService

logger = structlog.get_logger(__name__)


def _send_dispatch_failure_alert(*, exc: Exception, source: str) -> None:
  """SendErrorAlertTask 를 .apply() 로 동기 실행 — broker 무관하게 Slack HTTP 직접 호출.

  .delay() 를 쓰면 알림 task 자체가 같은 broker 를 거치므로, broker 장애가
  원인인 dispatch 실패에서는 알림 task 도 동일하게 실패한다 (특히 빈 broker URL
  의 memory:// silent fallback). .apply() 는 현재 프로세스에서 동기 실행하여
  broker 의존성을 제거한다.

  Slack API 자체가 실패해도 swallow — 무한 재귀 / 로그 폭주 방지.
  """
  try:
    RegisteredSendErrorAlertTask.apply(
      kwargs={
        "error_type": type(exc).__name__,
        "error_message": str(exc),
        "path": source,
        "method": "CELERY_TASK",
        "traceback": tb_module.format_exc(),
      }
    )
  except Exception:
    logger.exception("send_error_alert_dispatch_failed", source=source)


STEP_FIELD_MAP = {
  "video_converter": "scaled_video_key",
  "frame_extractor": "frame_prefix",
  "audio_extractor": "audio_key",
  "audio_scaler": "scaled_audio_key",
  "face_analyzer": "face_analysis_result_key",
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
    redis_app.send_task(
      "transcribe_audio",
      kwargs={
        "turn_id": int(turn_id),
        "audio_bucket": output_bucket,
        "audio_key": output_key,
      },
      queue="analysis-stt",
    )
    logger.info("transcribe_audio_dispatched", turn_id=turn_id)
  except Exception as exc:
    logger.exception("transcribe_audio_dispatch_failed", turn_id=turn_id)
    _send_dispatch_failure_alert(
      exc=exc,
      source=f"_dispatch_transcribe_audio (turn_id={turn_id}, queue=analysis-stt)",
    )


def _store_face_analysis_result(
  session_uuid: str, turn_id: str, output_bucket: str, output_key: str
) -> None:
  """face_analyzer step-complete 후처리: S3에서 결과를 읽어 DB에 저장한다.

  오케스트레이션만 담당하며, 각 단계는 별도 서비스에 위임한다.
  실패 시 알림을 보내되 예외를 전파하지 않는다.
  """
  from interviews.services.store_face_analysis_result_service import StoreFaceAnalysisResultService

  try:
    StoreFaceAnalysisResultService(
      session_uuid=session_uuid,
      turn_id=turn_id,
      output_bucket=output_bucket,
      output_key=output_key,
    ).perform()
    logger.info("face_analysis_result_stored", session_uuid=session_uuid, turn_id=turn_id)
  except Exception as exc:
    logger.exception("face_analysis_result_store_failed", session_uuid=session_uuid, turn_id=turn_id)
    _send_dispatch_failure_alert(
      exc=exc,
      source=f"_store_face_analysis_result (session={session_uuid}, turn={turn_id})",
    )


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
    logger.warning("unknown_step", step=step)
    return

  field_name = STEP_FIELD_MAP[step]

  try:
    UpdateRecordingStepService(
      session_uuid=session_uuid,
      turn_id=turn_id,
      field_name=field_name,
      output_key=output_key,
    ).perform()
    logger.info("step_complete", session_uuid=session_uuid, turn_id=turn_id, step=step)
  except Exception as exc:
    logger.exception(
      "step_complete_failed",
      session_uuid=session_uuid,
      turn_id=turn_id,
      step=step,
    )
    _send_dispatch_failure_alert(
      exc=exc,
      source=f"process_video_step_complete (session={session_uuid}, turn={turn_id}, step={step})",
    )
    raise

  if step == "audio_extractor":
    _dispatch_transcribe_audio(turn_id=turn_id, output_bucket=output_bucket, output_key=output_key)

  elif step == "face_analyzer":
    _store_face_analysis_result(
      session_uuid=session_uuid,
      turn_id=turn_id,
      output_bucket=output_bucket,
      output_key=output_key,
    )
