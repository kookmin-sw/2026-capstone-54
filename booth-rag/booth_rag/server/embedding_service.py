"""Standalone FastAPI embedding service.

Run on a beefier machine (e.g. a Mac Studio on the LAN) so the booth-rag
laptop can offload sentence-transformers inference.

Both ends must use the same EMBEDDING_LOCAL_MODEL — otherwise indexed vectors
and query vectors live in different spaces.
"""

from __future__ import annotations

import logging
import os
import time

from fastapi import FastAPI, HTTPException
from langchain_core.embeddings import Embeddings
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


os.environ.setdefault("EMBEDDING_BACKEND", "local")


def _build_server_embeddings() -> Embeddings:
    from booth_rag.rag.embeddings import _prewarm_rotary_cache, build_embeddings

    emb = build_embeddings(force_local=True)
    _prewarm_rotary_cache(emb)
    return emb


class DocsRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=512)


class DocsResponse(BaseModel):
    embeddings: list[list[float]]
    count: int
    dimension: int
    elapsed_ms: float


class QueryRequest(BaseModel):
    text: str


class QueryResponse(BaseModel):
    embedding: list[float]
    dimension: int
    elapsed_ms: float


class InfoResponse(BaseModel):
    model: str
    dimension: int
    device: str
    backend: str = "local"


def create_app() -> FastAPI:
    from booth_rag.config import get_settings
    from booth_rag.rag.embeddings import describe_embeddings

    app = FastAPI(
        title="booth-rag embedding service",
        version="0.1.0",
        description="HTTP endpoint that wraps sentence-transformers for remote use.",
    )

    settings = get_settings()
    embeddings = _build_server_embeddings()
    info = describe_embeddings(embeddings)

    cached_info = InfoResponse(
        model=info.model,
        dimension=info.dimension,
        device=info.device,
    )
    logger.info("Embedding service ready: %s", cached_info.model_dump())

    @app.get("/")
    async def root() -> dict[str, object]:
        return {
            "service": "booth-rag-embeddings",
            "model": cached_info.model,
            "dimension": cached_info.dimension,
            "device": cached_info.device,
        }

    @app.get("/health")
    async def health() -> dict[str, object]:
        return {"status": "ok", **cached_info.model_dump()}

    @app.get("/info", response_model=InfoResponse)
    async def info_endpoint() -> InfoResponse:
        return cached_info

    @app.post("/embed/documents", response_model=DocsResponse)
    async def embed_documents(payload: DocsRequest) -> DocsResponse:
        started = time.perf_counter()
        try:
            vectors = embeddings.embed_documents(payload.texts)
        except Exception as exc:
            logger.exception("embed_documents failed")
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        elapsed = (time.perf_counter() - started) * 1000.0
        return DocsResponse(
            embeddings=vectors,
            count=len(vectors),
            dimension=len(vectors[0]) if vectors else cached_info.dimension,
            elapsed_ms=elapsed,
        )

    @app.post("/embed/query", response_model=QueryResponse)
    async def embed_query(payload: QueryRequest) -> QueryResponse:
        started = time.perf_counter()
        try:
            vector = embeddings.embed_query(payload.text)
        except Exception as exc:
            logger.exception("embed_query failed")
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        elapsed = (time.perf_counter() - started) * 1000.0
        return QueryResponse(
            embedding=vector,
            dimension=len(vector),
            elapsed_ms=elapsed,
        )

    _ = settings
    return app


app = create_app()
