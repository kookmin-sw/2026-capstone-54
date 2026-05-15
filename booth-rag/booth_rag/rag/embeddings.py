from __future__ import annotations

import logging
from dataclasses import dataclass

import httpx
from langchain_core.embeddings import Embeddings

from booth_rag.config import get_settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class EmbeddingInfo:
    model: str
    device: str
    dimension: int


def _resolve_device(pref: str) -> str:
    if pref in {"cpu", "mps", "cuda"}:
        return pref
    try:
        import torch
    except Exception:
        return "cpu"
    if torch.cuda.is_available():
        return "cuda"
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def _build_local_embeddings(
    *,
    model_name: str | None = None,
    trust_remote_code: bool | None = None,
    role: str = "doc",
) -> Embeddings:
    settings = get_settings()
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
    except ImportError as exc:
        raise RuntimeError(
            "langchain-huggingface 가 설치되지 않았습니다. 다음을 실행하세요:\n"
            "  uv add langchain-huggingface sentence-transformers"
        ) from exc

    device = _resolve_device(settings.embedding_device.lower())
    resolved_name = model_name or settings.embedding_local_model
    effective_trust = trust_remote_code if trust_remote_code is not None else settings.embedding_trust_remote_code
    model_kwargs: dict[str, object] = {"device": device}
    if effective_trust:
        model_kwargs["trust_remote_code"] = True
    try:
        emb = HuggingFaceEmbeddings(
            model_name=resolved_name,
            model_kwargs=model_kwargs,
            encode_kwargs={"normalize_embeddings": True, "batch_size": 32},
        )
    except Exception as exc:
        raise RuntimeError(
            f"로컬 임베딩 모델 로드 실패: model={resolved_name} device={device} role={role} trust_remote_code={effective_trust}\n"
            f"네트워크가 막혀 있거나 모델 ID 가 잘못된 경우입니다. 원인: {exc}"
        ) from exc

    logger.info(
        "Local embeddings ready: model=%s device=%s role=%s trust_remote_code=%s",
        resolved_name,
        device,
        role,
        effective_trust,
    )
    return emb


class RemoteHuggingFaceEmbeddings(Embeddings):
    """LangChain `Embeddings` backed by a remote booth-rag embedding service.

    The HTTP contract is the one exposed by `booth_rag.server.embedding_service`:
        GET  /info                  -> {model, dimension, device}
        POST /embed/documents       -> {embeddings: [[...], ...]}
        POST /embed/query           -> {embedding: [...]}
    Documents are sent in batches of `batch_size` to keep individual requests small.
    """

    def __init__(
        self,
        base_url: str,
        *,
        timeout: float = 60.0,
        batch_size: int = 32,
    ):
        self._base_url = base_url.rstrip("/")
        self._batch_size = max(1, batch_size)
        self._client = httpx.Client(base_url=self._base_url, timeout=timeout)
        info = self._handshake()
        self.model_name: str = str(info["model"])
        self._dimension: int = int(info["dimension"])
        self._device: str = str(info.get("device", "remote"))
        logger.info(
            "Remote embeddings ready: base_url=%s model=%s dim=%d device=%s",
            self._base_url,
            self.model_name,
            self._dimension,
            self._device,
        )

    def _handshake(self) -> dict[str, object]:
        try:
            r = self._client.get("/info")
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            raise RuntimeError(
                f"원격 임베딩 서버 연결 실패: {self._base_url}\n"
                "맥 스튜디오 등 원격 머신에서 `bash scripts/run_embedding_server.sh` 가 실행 중인지,\n"
                "그리고 EMBEDDING_LOCAL_MODEL 이 양쪽에 같은 값으로 설정되어 있는지 확인하세요.\n"
                f"원인: {exc}"
            ) from exc

    @property
    def dimension(self) -> int:
        return self._dimension

    @property
    def device_label(self) -> str:
        return self._device

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        out: list[list[float]] = []
        for i in range(0, len(texts), self._batch_size):
            batch = texts[i : i + self._batch_size]
            r = self._client.post("/embed/documents", json={"texts": batch})
            r.raise_for_status()
            payload = r.json()
            out.extend(payload["embeddings"])
        return out

    def embed_query(self, text: str) -> list[float]:
        r = self._client.post("/embed/query", json={"text": text})
        r.raise_for_status()
        return r.json()["embedding"]


def build_embeddings(force_local: bool = False) -> Embeddings:
    settings = get_settings()
    backend = "local" if force_local else settings.embedding_backend.lower()

    if backend == "remote":
        return RemoteHuggingFaceEmbeddings(
            base_url=settings.remote_embedding_url,
            timeout=settings.remote_embedding_timeout,
            batch_size=settings.remote_embedding_batch_size,
        )
    if backend == "local":
        return _build_local_embeddings(role="doc")
    raise RuntimeError(f"Unknown EMBEDDING_BACKEND: {backend!r} (expected local | remote)")


def _prewarm_rotary_cache(emb: Embeddings) -> None:
    """Force one long-sequence forward pass to allocate the rotary cache.

    nomic-bert family (CodeRankEmbed, nomic-embed-text, etc.) caches cos/sin
    rotary embedding tables lazily in `_update_cos_sin_cache`, and that path
    is NOT thread-safe. Our ingest pipeline runs parallel embed calls
    (EMBEDDING_CONCURRENCY default 4) which races the cache update and
    crashes with shape mismatches like:

      RuntimeError: The size of tensor a (523) must match the size of
      tensor b (4) at non-singleton dimension 1

    See https://huggingface.co/nomic-ai/nomic-bert-2048/discussions/21

    Sending one long string at init time populates the cache to the model's
    max_seq_length. From then on, every concurrent forward only READS the
    cache, so the race never fires. Best-effort — failures here are logged
    but don't block startup.
    """
    try:
        long_text = "x " * 16000
        emb.embed_query(long_text)
        logger.info("Rotary cache prewarmed (thread-safety guard for nomic-bert family)")
    except Exception as exc:
        logger.warning("Rotary cache prewarm failed (non-fatal, continuing): %s", exc)


def build_code_embeddings() -> Embeddings:
    """Code-specialised embedder for the dual-index path.

    Routing rule:
      * embedding_backend == "remote" AND remote_embedding_code_url is set
        → call that URL (separate code embedding server, operator runs a
          second instance of run_embedding_server.sh on a different port).
      * Otherwise → local sentence-transformers with trust_remote_code
        forwarded from embedding_code_trust_remote_code (CodeRankEmbed
        and similar require it).

    For the local path we additionally prewarm the rotary embedding cache
    because nomic-bert family models are thread-unsafe on first forward.
    """
    settings = get_settings()
    if settings.embedding_backend.lower() == "remote" and settings.remote_embedding_code_url.strip():
        return RemoteHuggingFaceEmbeddings(
            base_url=settings.remote_embedding_code_url,
            timeout=settings.remote_embedding_timeout,
            batch_size=settings.remote_embedding_batch_size,
        )
    emb = _build_local_embeddings(
        model_name=settings.embedding_code_model,
        trust_remote_code=settings.embedding_code_trust_remote_code,
        role="code",
    )
    _prewarm_rotary_cache(emb)
    return emb


def describe_embeddings(emb: Embeddings) -> EmbeddingInfo:
    if isinstance(emb, RemoteHuggingFaceEmbeddings):
        return EmbeddingInfo(model=emb.model_name, device=f"remote:{emb.device_label}", dimension=emb.dimension)

    settings = get_settings()
    device = _resolve_device(settings.embedding_device.lower())
    model = getattr(emb, "model_name", None) or getattr(emb, "model", "unknown")
    dim = len(emb.embed_query("dimension probe"))
    return EmbeddingInfo(model=str(model), device=device, dimension=dim)
