from __future__ import annotations

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
    def __init__(self, embeddings: Embeddings, persist_dir: Path | None = None):
        self._persist_dir = persist_dir or get_settings().chroma_dir
        self._embeddings = embeddings
        self._info: EmbeddingInfo = describe_embeddings(embeddings)
        self._store = self._open()

    def _open(self) -> Chroma:
        return Chroma(
            collection_name=COLLECTION_NAME,
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
        return COLLECTION_NAME

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
            "collection": COLLECTION_NAME,
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
