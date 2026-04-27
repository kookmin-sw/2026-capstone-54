"""TranscribeRecordingTask 동작 검증 (voice-api mock)."""

from unittest.mock import MagicMock, patch

from celery.exceptions import Retry
from django.test import TestCase
from interviews.enums import RecordingStatus, TranscriptSource, TranscriptStatus
from interviews.factories import (
  InterviewRecordingFactory,
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from interviews.tasks.transcribe_recording_task import TranscribeRecordingTask
from users.factories import UserFactory


def _build_response(status_code: int, payload: dict | None = None, headers: dict | None = None) -> MagicMock:
  response = MagicMock()
  response.status_code = status_code
  response.headers = headers or {}
  response.json.return_value = payload or {}
  return response


class TranscribeRecordingTaskTests(TestCase):
  """voice-api 호출 + 결과 저장 + retry 분기 검증."""

  def setUp(self):
    self.user = UserFactory()
    self.session = InterviewSessionFactory(user=self.user)
    self.turn = InterviewTurnFactory(interview_session=self.session, answer="")
    self.recording = InterviewRecordingFactory(
      interview_session=self.session,
      interview_turn=self.turn,
      user=self.user,
      status=RecordingStatus.COMPLETED,
      audio_key="audio/key.mp3",
    )

  def _run_task(self, task: TranscribeRecordingTask):
    return task.run(recording_uuid=str(self.recording.pk), turn_id=self.turn.pk)

  def _patch_audio_url(self):
    return patch("interviews.tasks.transcribe_recording_task.GeneratePlaybackUrlService")

  def test_saves_transcript_when_voice_api_returns_200(self):
    """200 응답 시 speech_segments 저장 + transcript_status=completed + source=backend_stt."""
    payload = {
      "language": "ko",
      "duration_ms": 1234,
      "text": "안녕하세요",
      "segments": [{
        "start_ms": 0,
        "end_ms": 1000,
        "text": "안녕하세요",
        "confidence": 0.9
      }],
    }
    task = TranscribeRecordingTask()

    with self._patch_audio_url() as mock_url_service:
      mock_url_service.return_value.perform.return_value = {"audioUrl": "https://example.com/audio.mp3"}
      with patch(
        "interviews.tasks.transcribe_recording_task.requests.post",
        return_value=_build_response(200, payload),
      ):
        result = self._run_task(task)

    self.turn.refresh_from_db()
    self.assertEqual(result["status"], "completed")
    self.assertEqual(self.turn.transcript_status, TranscriptStatus.COMPLETED)
    self.assertEqual(self.turn.transcript_source, TranscriptSource.BACKEND_STT)
    self.assertEqual(self.turn.speech_segments, payload["segments"])
    self.assertEqual(self.turn.answer, "안녕하세요")

  def test_marks_failed_on_4xx_response(self):
    """4xx 응답은 즉시 실패 처리 (transcript_status=failed)."""
    task = TranscribeRecordingTask()

    with self._patch_audio_url() as mock_url_service:
      mock_url_service.return_value.perform.return_value = {"audioUrl": "https://example.com/audio.mp3"}
      with patch(
        "interviews.tasks.transcribe_recording_task.requests.post",
        return_value=_build_response(400),
      ):
        result = self._run_task(task)

    self.turn.refresh_from_db()
    self.assertEqual(result["status"], "failed")
    self.assertEqual(self.turn.transcript_status, TranscriptStatus.FAILED)
    self.assertTrue(self.turn.transcript_error_code.startswith("voice_api_"))

  def test_retries_on_503_with_retry_after(self):
    """503 + Retry-After 헤더는 retry 를 발생시킨다."""
    task = TranscribeRecordingTask()
    task.request_stack.push(MagicMock(retries=0, id="test"))

    with self._patch_audio_url() as mock_url_service:
      mock_url_service.return_value.perform.return_value = {"audioUrl": "https://example.com/audio.mp3"}
      with patch(
        "interviews.tasks.transcribe_recording_task.requests.post",
        return_value=_build_response(503, headers={"Retry-After": "30"}),
      ):
        with self.assertRaises(Retry):
          self._run_task(task)

  def test_retries_on_5xx(self):
    """5xx 응답은 retry 를 발생시킨다."""
    task = TranscribeRecordingTask()
    task.request_stack.push(MagicMock(retries=0, id="test"))

    with self._patch_audio_url() as mock_url_service:
      mock_url_service.return_value.perform.return_value = {"audioUrl": "https://example.com/audio.mp3"}
      with patch(
        "interviews.tasks.transcribe_recording_task.requests.post",
        return_value=_build_response(502),
      ):
        with self.assertRaises(Retry):
          self._run_task(task)

  def test_retries_when_audio_key_missing(self):
    """audio_key 가 비어있으면 retry 를 발생시킨다 (audio extraction 대기)."""
    self.recording.audio_key = ""
    self.recording.save(update_fields=["audio_key"])
    task = TranscribeRecordingTask()
    task.request_stack.push(MagicMock(retries=0, id="test"))

    with self.assertRaises(Retry):
      self._run_task(task)

  def test_marks_failed_when_audio_key_missing_after_max_retries(self):
    """audio_key retry 한도 초과 시 실패 처리."""
    self.recording.audio_key = ""
    self.recording.save(update_fields=["audio_key"])
    task = TranscribeRecordingTask()
    task.request_stack.push(MagicMock(retries=999, id="test"))

    result = self._run_task(task)

    self.turn.refresh_from_db()
    self.assertEqual(result["status"], "audio_key_unavailable")
    self.assertEqual(self.turn.transcript_status, TranscriptStatus.FAILED)
    self.assertEqual(self.turn.transcript_error_code, "audio_key_unavailable")

  def test_returns_recording_not_found(self):
    """존재하지 않는 recording_uuid 는 즉시 종료."""
    task = TranscribeRecordingTask()

    result = task.run(recording_uuid="00000000-0000-0000-0000-000000000000", turn_id=self.turn.pk)

    self.assertEqual(result["status"], "recording_not_found")
