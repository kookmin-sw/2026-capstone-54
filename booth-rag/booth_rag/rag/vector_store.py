from __future__ import annotations

import concurrent.futures as _cf
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from booth_rag.config import get_settings
from booth_rag.ingestion.code_chunker import CodeChunk
from booth_rag.rag.embeddings import EmbeddingInfo, describe_embeddings

COLLECTION_NAME = "booth_rag_chunks"
CODE_COLLECTION_NAME = "booth_rag_code"
DOCS_COLLECTION_NAME = "booth_rag_docs"

_CODE_SOURCE_KINDS: frozenset[str] = frozenset({"code", "structure"})


@dataclass(frozen=True)
class RetrievedChunk:
    rel_path: str
    text: str
    score: float
    kind: str
    symbol: str | None
    line_start: int
    line_end: int
    source_kind: str


class VectorIndex:
    def __init__(
        self,
        embeddings: Embeddings,
        persist_dir: Path | None = None,
        collection_name: str = COLLECTION_NAME,
    ):
        self._persist_dir = persist_dir or get_settings().chroma_dir
        self._embeddings = embeddings
        self._collection_name = collection_name
        self._info: EmbeddingInfo = describe_embeddings(embeddings)
        self._store = self._open()

    def _open(self) -> Chroma:
        return Chroma(
            collection_name=self._collection_name,
            embedding_function=self._embeddings,
            persist_directory=str(self._persist_dir),
            collection_metadata={
                "embedding_model": self._info.model,
                "embedding_device": self._info.device,
                "embedding_dimension": str(self._info.dimension),
            },
        )

    @property
    def info(self) -> EmbeddingInfo:
        return self._info

    @property
    def collection_name(self) -> str:
        return self._collection_name

    @property
    def raw_store(self) -> Chroma:
        """Underlying LangChain Chroma handle.

        Exposed so sparse indices (e.g. BM25) can iterate the same corpus
        without re-ingesting. Read-only contract from callers' perspective.
        """
        return self._store

    def add_chunks(self, chunks: Iterable[CodeChunk], source_kind: str) -> int:
        docs: list[Document] = []
        ids: list[str] = []
        for ch in chunks:
            doc_id = f"{source_kind}::{ch.rel_path}::{ch.chunk_index}"
            metadata = {
                "rel_path": ch.rel_path,
                "kind": ch.kind,
                "symbol": ch.symbol or "",
                "line_start": ch.line_start,
                "line_end": ch.line_end,
                "source_kind": source_kind,
            }
            docs.append(Document(page_content=ch.text, metadata=metadata))
            ids.append(doc_id)
        if not docs:
            return 0
        self._store.add_documents(documents=docs, ids=ids)
        return len(docs)

    def search(self, query: str, k: int = 6) -> list[RetrievedChunk]:
        results = self._store.similarity_search_with_relevance_scores(query, k=k)
        return [self._to_chunk(doc, float(score)) for doc, score in results]

    def search_mmr(
        self,
        query: str,
        k: int = 6,
        fetch_k: int = 20,
        lambda_mult: float = 0.7,
    ) -> list[RetrievedChunk]:
        """MMR search trades a fraction of relevance for diversity in the top-k.

        Falls back to plain similarity search when MMR is not available on the
        underlying Chroma version. Scores returned by Chroma's MMR helper are
        relevance-only (no distance), so we re-attach 1/(rank+1) so downstream
        ranking still has a usable monotonic score.
        """
        try:
            docs = self._store.max_marginal_relevance_search(
                query, k=k, fetch_k=max(fetch_k, k), lambda_mult=lambda_mult
            )
        except Exception:
            return self.search(query, k=k)
        return [self._to_chunk(doc, 1.0 / (rank + 1)) for rank, doc in enumerate(docs)]

    def _to_chunk(self, doc: Document, score: float) -> RetrievedChunk:
        md = doc.metadata or {}
        return RetrievedChunk(
            rel_path=md.get("rel_path", ""),
            text=doc.page_content,
            score=score,
            kind=md.get("kind", "generic"),
            symbol=md.get("symbol") or None,
            line_start=int(md.get("line_start", 0)),
            line_end=int(md.get("line_end", 0)),
            source_kind=md.get("source_kind", "code"),
        )

    def stats(self) -> dict[str, object]:
        try:
            count = self._store._collection.count()
        except Exception:
            count = 0
        return {
            "vector_count": count,
            "collection": self._collection_name,
            "embedding_model": self._info.model,
            "embedding_device": self._info.device,
            "embedding_dimension": self._info.dimension,
        }

    def reset(self) -> None:
        try:
            self._store.delete_collection()
        except Exception:
            pass
        self._store = self._open()


def _is_code_chunk(source_kind: str) -> bool:
    return source_kind in _CODE_SOURCE_KINDS


class DualVectorIndex:
    """Two underlying VectorIndex collections, dispatched by source_kind.

    Code-side chunks (source_kind ∈ {"code", "structure"}) embed with the
    code-specialised model; everything else (admin uploads, markdown,
    docx) embeds with the multilingual document model. Search fans out to
    both and fuses via RRF — score scales differ across models, so a
    rank-based fusion is the right blend.

    Exposes the same surface as VectorIndex (add_chunks / search /
    search_mmr / stats / reset / collection_name / info / raw_store) so
    HybridRetriever / BM25 callers don't need to know whether they're
    talking to a single- or dual-backend.
    """

    _executor: _cf.ThreadPoolExecutor | None = None

    @classmethod
    def _get_executor(cls) -> _cf.ThreadPoolExecutor:
        if cls._executor is None:
            cls._executor = _cf.ThreadPoolExecutor(max_workers=4, thread_name_prefix="dual-vec")
        return cls._executor

    def __init__(
        self,
        code_embeddings: Embeddings,
        doc_embeddings: Embeddings,
        persist_dir: Path | None = None,
    ):
        self._code = VectorIndex(
            code_embeddings,
            persist_dir=persist_dir,
            collection_name=CODE_COLLECTION_NAME,
        )
        self._doc = VectorIndex(
            doc_embeddings,
            persist_dir=persist_dir,
            collection_name=DOCS_COLLECTION_NAME,
        )

    @property
    def info(self) -> EmbeddingInfo:
        return self._doc.info

    @property
    def code_info(self) -> EmbeddingInfo:
        return self._code.info

    @property
    def collection_name(self) -> str:
        return f"{self._code.collection_name}+{self._doc.collection_name}"

    @property
    def raw_store(self) -> Chroma:
        return self._doc.raw_store

    @property
    def raw_stores(self) -> list[Chroma]:
        return [self._code.raw_store, self._doc.raw_store]

    def add_chunks(self, chunks: Iterable[CodeChunk], source_kind: str) -> int:
        target = self._code if _is_code_chunk(source_kind) else self._doc
        return target.add_chunks(chunks, source_kind=source_kind)

    def _fuse(self, lists: list[list[RetrievedChunk]], k: int) -> list[RetrievedChunk]:
        from booth_rag.rag.retriever import reciprocal_rank_fusion

        return reciprocal_rank_fusion(lists, rrf_k=60, top_k=k)

    def search(self, query: str, k: int = 6) -> list[RetrievedChunk]:
        ex = self._get_executor()
        code_fut = ex.submit(self._code.search, query, k=k)
        doc_fut = ex.submit(self._doc.search, query, k=k)
        return self._fuse([code_fut.result(), doc_fut.result()], k=k)

    def search_mmr(
        self,
        query: str,
        k: int = 6,
        fetch_k: int = 20,
        lambda_mult: float = 0.7,
    ) -> list[RetrievedChunk]:
        ex = self._get_executor()
        code_fut = ex.submit(self._code.search_mmr, query, k=k, fetch_k=fetch_k, lambda_mult=lambda_mult)
        doc_fut = ex.submit(self._doc.search_mmr, query, k=k, fetch_k=fetch_k, lambda_mult=lambda_mult)
        return self._fuse([code_fut.result(), doc_fut.result()], k=k)

    def stats(self) -> dict[str, object]:
        code_stats = self._code.stats()
        doc_stats = self._doc.stats()
        try:
            vec_count = int(code_stats.get("vector_count", 0)) + int(doc_stats.get("vector_count", 0))
        except (TypeError, ValueError):
            vec_count = 0
        return {
            "vector_count": vec_count,
            "vector_count_code": code_stats.get("vector_count", 0),
            "vector_count_docs": doc_stats.get("vector_count", 0),
            "collection": self.collection_name,
            "embedding_model": self._doc.info.model,
            "embedding_code_model": self._code.info.model,
            "embedding_device": self._doc.info.device,
            "embedding_dimension": self._doc.info.dimension,
            "embedding_code_dimension": self._code.info.dimension,
        }

    def reset(self) -> None:
        self._code.reset()
        self._doc.reset()
