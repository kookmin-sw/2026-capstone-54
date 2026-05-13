"""faster-whisper 모델 싱글톤 + transcribe 헬퍼."""

import logging
import threading

from faster_whisper import WhisperModel

from app import config

logger = logging.getLogger(__name__)

_MODEL: WhisperModel | None = None
_MODEL_LOCK = threading.Lock()


def get_model() -> WhisperModel:
  """프로세스 단위 싱글톤 WhisperModel."""
  global _MODEL
  if _MODEL is not None:
    return _MODEL
  with _MODEL_LOCK:
    if _MODEL is None:
      logger.info(
        "load_whisper_model size=%s device=%s compute_type=%s",
        config.STT_MODEL_SIZE,
        config.STT_DEVICE,
        config.STT_COMPUTE_TYPE,
      )
      _MODEL = WhisperModel(
        config.STT_MODEL_SIZE,
        device=config.STT_DEVICE,
        compute_type=config.STT_COMPUTE_TYPE,
      )
  return _MODEL


def transcribe_local_file(audio_path: str, language: str, prompt: str | None = None) -> dict:
  """로컬 audio file 을 STT 한 결과를 dict 로 반환."""
  model = get_model()
  segments_iter, info = model.transcribe(
    audio_path,
    language=language,
    initial_prompt=prompt,
    beam_size=1,
    vad_filter=True,
  )

  segments = []
  text_parts = []
  for segment in segments_iter:
    text_parts.append(segment.text)
    segments.append(
      {
        "start_ms": int(segment.start * 1000),
        "end_ms": int(segment.end * 1000),
        "text": segment.text,
        "avg_logprob": float(getattr(segment, "avg_logprob", 0.0)),
      }
    )

  return {
    "language": info.language or language,
    "duration_ms": int(info.duration * 1000),
    "text": "".join(text_parts).strip(),
    "segments": segments,
  }
