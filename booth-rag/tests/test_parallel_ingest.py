from __future__ import annotations

import asyncio
from collections import Counter
from pathlib import Path
from threading import Lock
from unittest.mock import patch

import pytest

from booth_rag.ingestion.code_chunker import CodeChunk
from booth_rag.ingestion.code_walker import CodeFile
from booth_rag.rag import service as service_module


def _file(rel_path: str) -> CodeFile:
    text = f"# {rel_path}\nimport os\n\ndef fn_{rel_path.replace('/', '_').replace('.', '_')}():\n    return 1\n"
    return CodeFile(
        path=Path(rel_path),
        rel_path=rel_path,
        suffix=".py",
        size_bytes=len(text.encode("utf-8")),
        text=text,
    )


class _FakeVectorIndex:
    def __init__(self) -> None:
        self._lock = Lock()
        self.added_ids: list[str] = []
        self.added_calls = 0

    def add_chunks(self, chunks, source_kind: str) -> int:
        items = list(chunks)
        with self._lock:
            self.added_calls += 1
            for ch in items:
                self.added_ids.append(f"{source_kind}::{ch.rel_path}::{ch.chunk_index}")
        return len(items)


def _build_service_with_fake_vector(concurrency: int) -> tuple[service_module.RagService, _FakeVectorIndex]:
    settings = service_module.get_settings()
    object.__setattr__(settings, "embedding_concurrency", concurrency)
    svc = service_module.RagService.__new__(service_module.RagService)
    svc._settings = settings
    fake = _FakeVectorIndex()
    svc._vector = fake  # type: ignore[attr-defined]
    return svc, fake


def _fake_chunk_file(file: CodeFile) -> list[CodeChunk]:
    return [
        CodeChunk(
            rel_path=file.rel_path,
            chunk_index=i,
            text=f"chunk-{i} of {file.rel_path}",
            kind="generic" if i > 0 else "outline",
            symbol=None,
            line_start=i * 10,
            line_end=i * 10 + 5,
        )
        for i in range(3)
    ]


@pytest.fixture(autouse=True)
def patch_chunker():
    with patch("booth_rag.rag.service.chunk_file", side_effect=_fake_chunk_file):
        yield


def test_serial_path_returns_expected_counts():
    svc, _fake = _build_service_with_fake_vector(concurrency=1)
    files = [_file(f"backend/m{i}.py") for i in range(4)]
    emitted: list[tuple[str, int]] = []

    def emit(phase: str, current: int, total: int, _message: str) -> None:
        emitted.append((phase, current))

    total, outlines = svc._embed_files_parallel(files, concurrency=1, emit=emit, total_files=len(files))
    assert total == 4 * 3
    assert outlines == 4
    assert emitted == [("files", 1), ("files", 2), ("files", 3), ("files", 4)]


def test_parallel_path_processes_every_file_exactly_once():
    svc, fake = _build_service_with_fake_vector(concurrency=4)
    files = [_file(f"backend/m{i}.py") for i in range(12)]

    def emit(_phase: str, _current: int, _total: int, _message: str) -> None:
        return

    total, outlines = svc._embed_files_parallel(files, concurrency=4, emit=emit, total_files=len(files))

    assert total == 12 * 3
    assert outlines == 12
    counts = Counter(fake.added_ids)
    assert all(c == 1 for c in counts.values()), "duplicate ids should never happen"
    assert len(counts) == 12 * 3


def test_parallel_path_no_duplicate_when_repeated_calls():
    svc, fake = _build_service_with_fake_vector(concurrency=4)
    files = [_file(f"backend/m{i}.py") for i in range(5)]

    def emit(*_args: object) -> None:
        return

    svc._embed_files_parallel(files, concurrency=4, emit=emit, total_files=len(files))
    svc._embed_files_parallel(files, concurrency=4, emit=emit, total_files=len(files))
    counts = Counter(fake.added_ids)
    assert all(c == 2 for c in counts.values()), "each id should be re-asserted exactly once per call"


def test_async_helper_directly_returns_consistent_totals():
    svc, _fake = _build_service_with_fake_vector(concurrency=8)
    files = [_file(f"backend/m{i}.py") for i in range(20)]

    def emit(*_args: object) -> None:
        return

    total, outlines = asyncio.run(svc._embed_files_async(files, concurrency=8, emit=emit, total_files=len(files)))
    assert total == 20 * 3
    assert outlines == 20
