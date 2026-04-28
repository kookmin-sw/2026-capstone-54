"""voice-api 기반 InterviewTurn STT 폴백 태스크."""

from __future__ import annotations

import requests
import structlog
from common.tasks.base_task import BaseTask
from config.celery import app
from django.conf import settings
from interviews.enums import TranscriptSource, TranscriptStatus
from interviews.models import InterviewRecording, InterviewTurn
from interviews.services.generate_playback_url_service import GeneratePlaybackUrlService

logger = structlog.get_logger(__name__)

AUDIO_KEY_RETRY_BACKOFF_SCHEDULE_SECONDS = (5, 15, 45, 120, 300, 900)
VOICE_API_RETRY_MAX = 5
VOICE_API_RETRY_BACKOFF_BASE_SECONDS = 30


class TranscribeRecordingTask(BaseTask):
  """recording.audio_key 가 준비되면 voice-api /api/v1/stt 를 호출해 결과를 turn 에 저장한다."""

  max_retries = max(len(AUDIO_KEY_RETRY_BACKOFF_SCHEDULE_SECONDS), VOICE_API_RETRY_MAX)

  def run(self, recording_uuid: str, turn_id: int):
    try:
      recording = InterviewRecording.objects.get(pk=recording_uuid)
    except InterviewRecording.DoesNotExist:
      logger.error("transcribe_recording_not_found", recording_uuid=recording_uuid)
      return {"status": "recording_not_found"}

    try:
      turn = InterviewTurn.objects.get(pk=turn_id)
    except InterviewTurn.DoesNotExist:
      logger.error("transcribe_turn_not_found", turn_id=turn_id)
      return {"status": "turn_not_found"}

    if not recording.audio_key:
      backoff = self._audio_key_retry_backoff()
      if backoff is None:
        self._mark_failed(turn, "audio_key_unavailable")
        return {"status": "audio_key_unavailable"}
      raise self.retry(countdown=backoff)

    self._mark_processing(turn)
    audio_url = self._issue_audio_url(recording)

    response = self._post_to_voice_api(audio_url=audio_url)

    if response is None:
      raise self.retry(countdown=self._voice_api_retry_backoff())

    if response.status_code == 503:
      retry_after = response.headers.get("Retry-After")
      countdown = int(retry_after) if retry_after and retry_after.isdigit() else self._voice_api_retry_backoff()
      raise self.retry(countdown=countdown)

    if response.status_code >= 500:
      raise self.retry(countdown=self._voice_api_retry_backoff())

    if 400 <= response.status_code < 500:
      self._mark_failed(turn, f"voice_api_{response.status_code}")
      return {"status": "failed", "http_status": response.status_code}

    payload = response.json()
    self._save_transcript(turn, payload)
    return {"status": "completed", "turn_id": turn.pk}

  def _audio_key_retry_backoff(self) -> int | None:
    attempt = self.request.retries
    if attempt >= len(AUDIO_KEY_RETRY_BACKOFF_SCHEDULE_SECONDS):
      return None
    return AUDIO_KEY_RETRY_BACKOFF_SCHEDULE_SECONDS[attempt]

  def _voice_api_retry_backoff(self) -> int:
    attempt = max(self.request.retries, 0)
    return min(VOICE_API_RETRY_BACKOFF_BASE_SECONDS * (2**attempt), 900)

  @staticmethod
  def _issue_audio_url(recording: InterviewRecording) -> str:
    result = GeneratePlaybackUrlService(user=recording.user, recording=recording).perform()
    audio_url = result.get("audioUrl")
    if not audio_url:
      raise RuntimeError("audio presigned URL 발급에 실패했습니다.")
    return audio_url

  @staticmethod
  def _post_to_voice_api(audio_url: str):
    url = f"{settings.VOICE_API_URL.rstrip('/')}/api/v1/stt"
    headers = {"Content-Type": "application/json"}
    if settings.VOICE_API_AUTH_TOKEN:
      headers["Authorization"] = f"Bearer {settings.VOICE_API_AUTH_TOKEN}"
    payload = {"audio_url": audio_url, "language": "ko"}

    try:
      return requests.post(
        url,
        json=payload,
        headers=headers,
        timeout=settings.VOICE_API_TIMEOUT_SECONDS,
      )
    except requests.RequestException as exc:
      logger.warning("voice_api_request_exception", error=str(exc))
      return None

  @staticmethod
  def _mark_processing(turn: InterviewTurn) -> None:
    turn.transcript_status = TranscriptStatus.PROCESSING
    turn.save(update_fields=["transcript_status"])

  @staticmethod
  def _mark_failed(turn: InterviewTurn, error_code: str) -> None:
    turn.transcript_status = TranscriptStatus.FAILED
    turn.transcript_error_code = error_code
    turn.save(update_fields=["transcript_status", "transcript_error_code"])

  @staticmethod
  def _save_transcript(turn: InterviewTurn, payload: dict) -> None:
    segments = payload.get("segments", [])
    transcribed_text = payload.get("text", "")
    turn.speech_segments = segments
    turn.transcript_status = TranscriptStatus.COMPLETED
    turn.transcript_source = TranscriptSource.BACKEND_STT
    turn.transcript_error_code = ""
    if transcribed_text:
      turn.answer = transcribed_text
    turn.save(
      update_fields=[
        "speech_segments",
        "transcript_status",
        "transcript_source",
        "transcript_error_code",
        "answer",
      ]
    )


RegisteredTranscribeRecordingTask = app.register_task(TranscribeRecordingTask())
