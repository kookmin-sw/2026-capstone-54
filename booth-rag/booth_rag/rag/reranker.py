"""Cross-encoder reranking layer for the booth-rag retriever.

After RRF fuses dense + BM25 + multi-query results, a bi-encoder cosine
score loses fidelity on the long-tail of "almost-right" chunks. A cross-
encoder scores each (query, chunk) pair jointly — much more accurate but
too slow for the full corpus. So we use it surgically: take the top-N
fused candidates and re-order them with the cross-encoder.

The model is loaded lazily on the first rerank() call so app boot stays
fast when reranking is disabled. Failures (no network on first download,
incompatible weights, OOM) downgrade gracefully — rerank() returns the
input order unchanged so the chat flow keeps working.
"""

from __future__ import annotations

import logging
import threading
from typing import Any, Protocol

logger = logging.getLogger(__name__)


class _Scoreable(Protocol):
    text: str


class CrossEncoderReranker:
    def __init__(self, model_name: str, device_pref: str = "auto") -> None:
        self._model_name = model_name
        self._device_pref = device_pref
        self._model: Any | None = None
        self._load_failed = False
        self._lock = threading.Lock()

    def _ensure_loaded(self) -> None:
        if self._model is not None or self._load_failed:
            return
        with self._lock:
            if self._model is not None or self._load_failed:
                return
            try:
                from sentence_transformers import CrossEncoder

                from booth_rag.rag.embeddings import _resolve_device

                device = _resolve_device(self._device_pref.lower())
                self._model = CrossEncoder(self._model_name, device=device)
                logger.info("CrossEncoder ready: model=%s device=%s", self._model_name, device)
            except Exception as exc:
                self._load_failed = True
                logger.warning(
                    "CrossEncoder load failed (model=%s) — reranking disabled this session: %s",
                    self._model_name,
                    exc,
                )

    @property
    def ready(self) -> bool:
        self._ensure_loaded()
        return self._model is not None

    def rerank(
        self,
        query: str,
        chunks: list[Any],
        top_k: int | None = None,
    ) -> list[Any]:
        if not chunks or not query or not query.strip():
            return chunks
        self._ensure_loaded()
        if self._model is None:
            return chunks
        try:
            pairs = [(query, getattr(c, "text", "") or "") for c in chunks]
            scores = self._model.predict(pairs, convert_to_numpy=True, show_progress_bar=False)
        except Exception as exc:
            logger.warning("CrossEncoder predict failed — falling back to input order: %s", exc)
            return chunks
        scored = sorted(
            zip(chunks, scores, strict=False),
            key=lambda x: float(x[1]),
            reverse=True,
        )
        out = [c for c, _ in scored]
        return out[:top_k] if top_k else out
