from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from booth_rag.rag import vector_store
from booth_rag.rag.vector_store import (
    CODE_COLLECTION_NAME,
    DOCS_COLLECTION_NAME,
    DualVectorIndex,
    RetrievedChunk,
    _is_code_chunk,
)


@dataclass
class _FakeChunk:
    rel_path: str = "p"
    chunk_index: int = 0
    text: str = "x"
    kind: str = "function"
    symbol: str | None = None
    line_start: int = 1
    line_end: int = 2


@dataclass
class _StubInfo:
    model: str = "stub-model"
    device: str = "cpu"
    dimension: int = 8


@dataclass
class _StubVectorIndex:
    embeddings: Any = None
    persist_dir: Any = None
    collection_name: str = "stub"
    added: list[tuple[str, int]] = field(default_factory=list)
    search_returns: list[RetrievedChunk] = field(default_factory=list)

    def __init__(self, embeddings=None, persist_dir=None, collection_name="stub"):
        self.embeddings = embeddings
        self.persist_dir = persist_dir
        self.collection_name = collection_name
        self.added = []
        self.search_returns = []
        self.reset_called = False

    @property
    def info(self) -> _StubInfo:
        return _StubInfo(model=f"model-for-{self.collection_name}")

    @property
    def raw_store(self) -> object:
        return f"raw-store-{self.collection_name}"

    def add_chunks(self, chunks, source_kind: str) -> int:
        items = list(chunks)
        self.added.append((source_kind, len(items)))
        return len(items)

    def search(self, query: str, k: int = 6) -> list[RetrievedChunk]:
        return list(self.search_returns)

    def search_mmr(self, query: str, k: int = 6, fetch_k: int = 20, lambda_mult: float = 0.7):
        return list(self.search_returns)

    def stats(self) -> dict[str, object]:
        return {
            "vector_count": len(self.added),
            "collection": self.collection_name,
            "embedding_model": self.info.model,
            "embedding_device": self.info.device,
            "embedding_dimension": self.info.dimension,
        }

    def reset(self) -> None:
        self.reset_called = True


def _patch_vector_index(monkeypatch):
    monkeypatch.setattr(vector_store, "VectorIndex", _StubVectorIndex)


def _chunk(rel: str, kind: str = "function", source: str = "code") -> RetrievedChunk:
    return RetrievedChunk(
        rel_path=rel,
        text=f"text:{rel}",
        score=1.0,
        kind=kind,
        symbol=None,
        line_start=1,
        line_end=2,
        source_kind=source,
    )


def test_is_code_chunk_dispatch_rules():
    assert _is_code_chunk("code")
    assert _is_code_chunk("structure")
    assert not _is_code_chunk("admin_doc")
    assert not _is_code_chunk("markdown")
    assert not _is_code_chunk("")


def test_dual_init_creates_two_collections_with_correct_names(monkeypatch):
    _patch_vector_index(monkeypatch)
    d = DualVectorIndex(code_embeddings=object(), doc_embeddings=object())
    assert d._code.collection_name == CODE_COLLECTION_NAME
    assert d._doc.collection_name == DOCS_COLLECTION_NAME


def test_dual_add_chunks_routes_code_to_code_index(monkeypatch):
    _patch_vector_index(monkeypatch)
    d = DualVectorIndex(code_embeddings=object(), doc_embeddings=object())
    d.add_chunks([_FakeChunk()], source_kind="code")
    d.add_chunks([_FakeChunk(), _FakeChunk()], source_kind="structure")
    assert d._code.added == [("code", 1), ("structure", 2)]
    assert d._doc.added == []


def test_dual_add_chunks_routes_docs_to_doc_index(monkeypatch):
    _patch_vector_index(monkeypatch)
    d = DualVectorIndex(code_embeddings=object(), doc_embeddings=object())
    d.add_chunks([_FakeChunk()], source_kind="admin_doc")
    d.add_chunks([_FakeChunk()], source_kind="markdown")
    assert d._code.added == []
    assert d._doc.added == [("admin_doc", 1), ("markdown", 1)]


def test_dual_search_fuses_results_from_both(monkeypatch):
    _patch_vector_index(monkeypatch)
    d = DualVectorIndex(code_embeddings=object(), doc_embeddings=object())
    d._code.search_returns = [_chunk("backend/core.py", "function"), _chunk("backend/api.py", "outline")]
    d._doc.search_returns = [_chunk("docs/report.md", "markdown_section", source="admin_doc")]
    out = d.search("query", k=6)
    paths = {c.rel_path for c in out}
    assert "backend/core.py" in paths
    assert "docs/report.md" in paths


def test_dual_raw_stores_returns_both(monkeypatch):
    _patch_vector_index(monkeypatch)
    d = DualVectorIndex(code_embeddings=object(), doc_embeddings=object())
    stores = d.raw_stores
    assert len(stores) == 2
    assert "raw-store-booth_rag_code" in stores
    assert "raw-store-booth_rag_docs" in stores


def test_dual_stats_sums_vector_counts(monkeypatch):
    _patch_vector_index(monkeypatch)
    d = DualVectorIndex(code_embeddings=object(), doc_embeddings=object())
    d.add_chunks([_FakeChunk()], source_kind="code")
    d.add_chunks([_FakeChunk()], source_kind="structure")
    d.add_chunks([_FakeChunk()], source_kind="admin_doc")
    stats = d.stats()
    assert stats["vector_count_code"] == 2
    assert stats["vector_count_docs"] == 1
    assert stats["vector_count"] == 3
    assert stats["embedding_code_model"]
    assert stats["embedding_model"]


def test_dual_reset_clears_both(monkeypatch):
    _patch_vector_index(monkeypatch)
    d = DualVectorIndex(code_embeddings=object(), doc_embeddings=object())
    d.reset()
    assert d._code.reset_called
    assert d._doc.reset_called
