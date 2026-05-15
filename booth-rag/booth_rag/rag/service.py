from __future__ import annotations

import asyncio
import logging
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from pathlib import Path
from threading import Lock

from booth_rag.config import get_settings
from booth_rag.ingestion.code_chunker import chunk_file
from booth_rag.ingestion.code_walker import CodeFile, count_files, walk_repo
from booth_rag.ingestion.doc_loader import chunk_document, load_document
from booth_rag.ingestion.structure_indexer import (
    build_directory_summary_chunks,
    build_repo_map_chunk,
)
from booth_rag.rag.bm25_store import BM25Index
from booth_rag.rag.chains import ChatChain
from booth_rag.rag.embeddings import build_embeddings
from booth_rag.rag.graph_store import KnowledgeGraph
from booth_rag.rag.reranker import CrossEncoderReranker
from booth_rag.rag.retriever import HybridRetriever
from booth_rag.rag.vector_store import VectorIndex

logger = logging.getLogger(__name__)


@dataclass
class IngestionProgress:
    phase: str
    current: int
    total: int
    message: str

    @property
    def pct(self) -> float:
        return (self.current / self.total * 100.0) if self.total else 0.0


ProgressCallback = Callable[[IngestionProgress], None]


@dataclass
class IngestionStats:
    files_indexed: int
    chunks_indexed: int
    secrets_skipped: int
    graph_nodes_added: int
    outline_chunks: int
    directory_summary_chunks: int


class RagService:
    def __init__(self) -> None:
        self._settings = get_settings()
        self._embeddings = build_embeddings()
        self._vector = VectorIndex(self._embeddings)
        self._graph = KnowledgeGraph()
        self._bm25 = BM25Index()
        self._reranker: CrossEncoderReranker | None = None
        if self._settings.rag_use_reranker:
            self._reranker = CrossEncoderReranker(
                model_name=self._settings.rag_reranker_model,
                device_pref=self._settings.embedding_device,
            )
        self._retriever = HybridRetriever(
            self._vector,
            self._graph,
            bm25=self._bm25,
            reranker=self._reranker,
        )
        self._chain = ChatChain(self._retriever)
        self._last_progress: IngestionProgress | None = None
        self._is_ingesting = False
        info = self._vector.info
        bm25_size = self._rebuild_bm25_safely()
        logger.info(
            "RagService ready: model=%s device=%s dim=%d collection=%s bm25=%d reranker=%s",
            info.model,
            info.device,
            info.dimension,
            self._vector.collection_name,
            bm25_size,
            self._settings.rag_reranker_model if self._reranker else "off",
        )

    def _rebuild_bm25_safely(self) -> int:
        if not self._settings.rag_use_bm25:
            return 0
        try:
            return self._bm25.rebuild_from_chroma(self._vector.raw_store)
        except Exception:
            logger.exception("BM25 rebuild failed; sparse retrieval disabled until next ingest")
            return 0

    @property
    def chain(self) -> ChatChain:
        return self._chain

    @property
    def last_progress(self) -> IngestionProgress | None:
        return self._last_progress

    @property
    def is_ingesting(self) -> bool:
        return self._is_ingesting

    @property
    def embedding_info(self) -> dict[str, object]:
        info = self._vector.info
        return {"model": info.model, "device": info.device, "dimension": info.dimension}

    def stats(self) -> dict[str, object]:
        out: dict[str, object] = {
            "openai_chat_enabled": self._settings.has_openai,
            "is_ingesting": self._is_ingesting,
            "bm25_enabled": self._settings.rag_use_bm25,
            "bm25_size": self._bm25.size,
            "reranker_enabled": self._settings.rag_use_reranker and self._reranker is not None,
            "reranker_model": self._settings.rag_reranker_model if self._reranker else None,
        }
        out.update(self._vector.stats())
        out.update(self._graph.stats())
        if self._last_progress is not None:
            out["last_progress"] = {
                "phase": self._last_progress.phase,
                "current": self._last_progress.current,
                "total": self._last_progress.total,
                "pct": round(self._last_progress.pct, 1),
                "message": self._last_progress.message,
            }
        return out

    def ingest_codebase(
        self,
        max_files: int | None = None,
        include_top_dirs: Sequence[str] | None = None,
        progress_callback: ProgressCallback | None = None,
    ) -> IngestionStats:
        source_path = self._settings.source_repo_path
        if not source_path.exists():
            raise FileNotFoundError(f"Source repo path not found: {source_path}")

        top_dirs = tuple(include_top_dirs) if include_top_dirs else self._settings.ingest_include_dirs
        total_files = count_files(source_path, include_top_dirs=top_dirs)
        if max_files is not None:
            total_files = min(total_files, max_files)
        logger.info(
            "Starting ingestion: source=%s dirs=%s estimated_files=%d",
            source_path,
            list(top_dirs),
            total_files,
        )

        def emit(phase: str, current: int, total: int, message: str) -> None:
            progress = IngestionProgress(phase=phase, current=current, total=total, message=message)
            self._last_progress = progress
            if progress_callback is not None:
                try:
                    progress_callback(progress)
                except Exception:
                    logger.exception("progress_callback raised")
            logger.debug("[%s] %d/%d — %s", phase, current, total, message)

        concurrency = max(1, self._settings.embedding_concurrency)
        self._is_ingesting = True
        try:
            emit("scan", 0, total_files, "디렉토리 스캔 시작")
            files: list[CodeFile] = []
            for i, code_file in enumerate(walk_repo(source_path, include_top_dirs=top_dirs), start=1):
                if max_files is not None and i > max_files:
                    break
                files.append(code_file)

            chunks_total, outline_count = self._embed_files_parallel(
                files,
                concurrency=concurrency,
                emit=emit,
                total_files=total_files,
            )

            emit("graph", len(files), len(files), "그래프 빌드 중")
            added_nodes = self._graph.merge_files(files)
            self._graph.save()

            emit("structure", 0, 1, "디렉토리 요약 청크 생성")
            dir_chunks = build_directory_summary_chunks(source_path, files, top_dirs)
            repo_map = build_repo_map_chunk(source_path, top_dirs)
            structure_added = self._vector.add_chunks([repo_map, *dir_chunks], source_kind="structure")
            chunks_total += structure_added

            emit("bm25", 0, 1, "BM25 키워드 인덱스 재구축")
            self._rebuild_bm25_safely()

            emit("done", len(files), max(total_files, len(files)), "완료")
            return IngestionStats(
                files_indexed=len(files),
                chunks_indexed=chunks_total,
                secrets_skipped=0,
                graph_nodes_added=added_nodes,
                outline_chunks=outline_count,
                directory_summary_chunks=structure_added,
            )
        finally:
            self._is_ingesting = False

    def _embed_files_parallel(
        self,
        files: Sequence[CodeFile],
        *,
        concurrency: int,
        emit: Callable[[str, int, int, str], None],
        total_files: int,
    ) -> tuple[int, int]:
        """Fan out chunk_file + vector.add_chunks across files with a Semaphore.

        Each chunk's doc_id is `code::{rel_path}::{chunk_index}` — unique per
        (file, position) tuple. ChromaDB upserts on collision so a duplicate
        add (e.g. retried task) is idempotent. Files are processed in input
        order from the worker pool but emit() is serialised under a lock.
        """
        if not files:
            return 0, 0

        if concurrency == 1:
            chunks_total = 0
            outline_count = 0
            for i, code_file in enumerate(files, start=1):
                chunks = chunk_file(code_file)
                outline_count += sum(1 for c in chunks if c.kind == "outline")
                chunks_total += self._vector.add_chunks(chunks, source_kind="code")
                emit("files", i, total_files, code_file.rel_path)
            return chunks_total, outline_count

        return asyncio.run(
            self._embed_files_async(
                files,
                concurrency=concurrency,
                emit=emit,
                total_files=total_files,
            )
        )

    async def _embed_files_async(
        self,
        files: Sequence[CodeFile],
        *,
        concurrency: int,
        emit: Callable[[str, int, int, str], None],
        total_files: int,
    ) -> tuple[int, int]:
        sem = asyncio.Semaphore(concurrency)
        completed_lock = Lock()
        completed = 0
        chunks_total = 0
        outline_count = 0
        logger.info("Parallel ingest: %d files with concurrency=%d", len(files), concurrency)

        async def process(code_file: CodeFile) -> None:
            nonlocal completed, chunks_total, outline_count
            async with sem:

                def _work() -> tuple[int, int]:
                    file_chunks = chunk_file(code_file)
                    outline_in_file = sum(1 for c in file_chunks if c.kind == "outline")
                    added = self._vector.add_chunks(file_chunks, source_kind="code")
                    return added, outline_in_file

                added, outline_in_file = await asyncio.to_thread(_work)
                with completed_lock:
                    completed += 1
                    chunks_total += added
                    outline_count += outline_in_file
                    current = completed
                emit("files", current, total_files, code_file.rel_path)

        await asyncio.gather(*(process(f) for f in files))
        return chunks_total, outline_count

    def ingest_document_path(
        self,
        path: Path,
        progress_callback: ProgressCallback | None = None,
    ) -> IngestionStats:
        if progress_callback is not None:
            progress_callback(IngestionProgress("load", 0, 1, path.name))
        doc = load_document(path)
        if doc is None:
            return IngestionStats(0, 0, 0, 0, 0, 0)
        if progress_callback is not None:
            section_count = len(doc.docx_sections) if doc.docx_sections else 1
            progress_callback(IngestionProgress("chunk", 0, section_count, "청킹 중"))
        chunks = chunk_document(doc)
        if progress_callback is not None:
            progress_callback(IngestionProgress("embed", 0, len(chunks), "임베딩 + 저장"))
        added = self._vector.add_chunks(chunks, source_kind="admin_doc")
        if progress_callback is not None:
            progress_callback(IngestionProgress("bm25", 0, 1, "BM25 키워드 인덱스 재구축"))
        self._rebuild_bm25_safely()
        if progress_callback is not None:
            progress_callback(IngestionProgress("done", added, added, "완료"))
        return IngestionStats(
            files_indexed=1,
            chunks_indexed=added,
            secrets_skipped=0,
            graph_nodes_added=0,
            outline_chunks=0,
            directory_summary_chunks=0,
        )

    def reset_index(self) -> None:
        self._vector.reset()
        self._graph.reset()
        self._bm25 = BM25Index()
        self._retriever = HybridRetriever(
            self._vector,
            self._graph,
            bm25=self._bm25,
            reranker=self._reranker,
        )
        self._chain = ChatChain(self._retriever)
        logger.info("Index cleared (vector + graph + BM25). Next ingest will re-build from scratch.")


_singleton: RagService | None = None


def get_rag_service() -> RagService:
    global _singleton
    if _singleton is None:
        _singleton = RagService()
    return _singleton


def reset_singleton() -> None:
    global _singleton
    _singleton = None
