"""BM25 sparse retrieval coverage.

BM25 is the keyword-matching backstop for dense embedding misses on short
Korean queries and code identifiers. These tests pin down:
  - the tokenizer's Korean+English+CamelCase behaviour,
  - empty-corpus and empty-query fallbacks (must never crash chat),
  - rebuild-from-chroma using a stub that mimics the LangChain Chroma shape,
  - the HybridRetriever integrating BM25 hits via RRF fusion.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Any

import pytest

from booth_rag.rag.bm25_store import BM25Index, tokenize
from booth_rag.rag.retriever import HybridRetriever
from booth_rag.rag.vector_store import RetrievedChunk


def test_tokenize_splits_korean_english_and_punctuation():
    out = tokenize("회원가입 어떻게? signup flow!")
    assert "회원가입" in out
    assert "signup" in out
    assert "flow" in out
    assert "어떻게" in out


def test_tokenize_splits_camel_and_snake_case():
    out = tokenize("getUserProfile camelCase + snake_case + UPPER_SNAKE")
    assert "getuserprofile" in out
    assert "get" in out
    assert "user" in out
    assert "profile" in out
    assert "camel" in out
    assert "case" in out
    assert "snake" in out
    assert "upper" in out


def test_tokenize_returns_empty_on_blank():
    assert tokenize("") == []
    assert tokenize("   ") == []
    assert tokenize("!@#$%") == []


def test_tokenize_drops_single_char_tokens():
    out = tokenize("a bb ccc d e")
    assert "a" not in out
    assert "d" not in out
    assert "bb" in out
    assert "ccc" in out


def test_bm25_empty_index_returns_no_hits():
    idx = BM25Index()
    assert idx.size == 0
    assert idx.search("회원가입", k=5) == []


class _FakeCollection:
    def __init__(self, docs: Sequence[dict[str, Any]]):
        self._docs = list(docs)

    def get(self, *, include: Sequence[str]) -> dict[str, Any]:
        ids = [d["id"] for d in self._docs]
        documents = [d["text"] for d in self._docs]
        metadatas = [d["metadata"] for d in self._docs]
        return {"ids": ids, "documents": documents, "metadatas": metadatas}


class _FakeStore:
    def __init__(self, docs: Sequence[dict[str, Any]]):
        self._collection = _FakeCollection(docs)


def _doc(idx: int, text: str, **meta: Any) -> dict[str, Any]:
    return {
        "id": f"code::{meta.get('rel_path', 'x.py')}::{idx}",
        "text": text,
        "metadata": {
            "rel_path": meta.get("rel_path", "x.py"),
            "kind": meta.get("kind", "function"),
            "symbol": meta.get("symbol", ""),
            "line_start": meta.get("line_start", 1),
            "line_end": meta.get("line_end", 10),
            "source_kind": meta.get("source_kind", "code"),
        },
    }


def test_bm25_rebuild_and_search_picks_up_korean_keyword():
    store = _FakeStore(
        [
            _doc(0, "이력서 분석은 PDF 를 파싱한 뒤 임베딩으로 분류합니다", rel_path="backend/resume/parser.py"),
            _doc(1, "회원가입 절차는 이메일 인증과 비밀번호 해시 저장으로 끝납니다", rel_path="backend/auth/signup.py"),
            _doc(2, "프론트엔드 결제 위젯은 Toss 의 SDK 를 직접 호출합니다", rel_path="frontend/pay/widget.tsx"),
        ]
    )
    idx = BM25Index()
    n = idx.rebuild_from_chroma(store)
    assert n == 3
    assert idx.size == 3

    hits = idx.search("회원가입", k=2)
    assert len(hits) >= 1
    assert hits[0].rel_path == "backend/auth/signup.py"
    assert hits[0].score > 0


def test_bm25_rebuild_with_no_documents_returns_zero():
    store = _FakeStore([])
    idx = BM25Index()
    assert idx.rebuild_from_chroma(store) == 0
    assert idx.size == 0
    assert idx.search("anything", k=5) == []


def test_bm25_search_handles_zero_score_query_gracefully():
    store = _FakeStore([_doc(0, "totally unrelated content here", rel_path="x.py")])
    idx = BM25Index()
    idx.rebuild_from_chroma(store)
    assert idx.search("회원가입 절차", k=5) == []


def test_bm25_rebuild_skips_when_chroma_get_raises():
    class _BadStore:
        @property
        def _collection(self):
            raise RuntimeError("chroma unavailable")

    idx = BM25Index()
    assert idx.rebuild_from_chroma(_BadStore()) == 0
    assert idx.size == 0


class _StubVectorIndex:
    def __init__(self, hits_by_query: dict[str, list[RetrievedChunk]]):
        self._hits = hits_by_query

    def search(self, query: str, k: int = 6) -> list[RetrievedChunk]:
        return list(self._hits.get(query, []))[:k]

    def search_mmr(self, query: str, k: int = 6, fetch_k: int = 20, lambda_mult: float = 0.7):
        return self.search(query, k=k)


@dataclass
class _StubGraph:
    def neighbors(self, *_args, **_kwargs):
        return set()

    def symbol_neighbors(self, *_args, **_kwargs):
        return []

    def file_ppr_scores(self, *_args, **_kwargs):
        return []

    def hub_files(self, *_args, **_kwargs):
        return []


def _retrieved(rel: str, text: str = "x" * 200, score: float = 0.5) -> RetrievedChunk:
    return RetrievedChunk(
        rel_path=rel,
        text=text,
        score=score,
        kind="function",
        symbol=None,
        line_start=1,
        line_end=10,
        source_kind="code",
    )


def test_hybrid_retriever_uses_bm25_when_enabled(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("RAG_USE_BM25", "true")
    monkeypatch.setenv("RAG_USE_MMR", "false")
    monkeypatch.setenv("GRAPH_USE_PAGERANK", "false")
    from booth_rag.config import get_settings

    get_settings.cache_clear()

    dense_only_hit = _retrieved(
        "dense/only.py",
        text="의미적 매칭으로만 잡히는 본문입니다. 키워드는 직접 등장하지 않지만 임베딩으로 가까운 청크. " * 4,
    )
    vector = _StubVectorIndex({"회원가입": [dense_only_hit]})

    docs = [
        _doc(
            0,
            "회원가입 절차는 이메일 인증과 비밀번호 해시 저장으로 끝납니다. " * 6,
            rel_path="sparse/only.py",
        ),
        _doc(1, "이력서 분석은 PDF 를 파싱한 뒤 임베딩으로 분류합니다. " * 6, rel_path="other/a.py"),
        _doc(2, "프론트엔드 결제 위젯은 Toss 의 SDK 를 직접 호출합니다. " * 6, rel_path="other/b.py"),
        _doc(3, "면접관 모듈은 음성 STT 결과를 분석해 점수를 매깁니다. " * 6, rel_path="other/c.py"),
    ]
    bm25 = BM25Index()
    bm25.rebuild_from_chroma(_FakeStore(docs))

    retriever = HybridRetriever(vector, _StubGraph(), bm25=bm25)
    ctx = retriever.retrieve("회원가입", k=4)
    paths = {c.rel_path for c in ctx.chunks}
    assert "dense/only.py" in paths
    assert "sparse/only.py" in paths, "BM25 hit must be fused into the final context"
    get_settings.cache_clear()


def test_hybrid_retriever_skips_bm25_when_disabled(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("RAG_USE_BM25", "false")
    monkeypatch.setenv("RAG_USE_MMR", "false")
    monkeypatch.setenv("GRAPH_USE_PAGERANK", "false")
    from booth_rag.config import get_settings

    get_settings.cache_clear()

    dense_hit = _retrieved("dense/only.py", text="의미적 매칭 본문 " * 30)
    vector = _StubVectorIndex({"회원가입": [dense_hit]})

    docs = [
        {
            "id": "code::sparse/only.py::0",
            "text": "회원가입 본문 " * 30,
            "metadata": {
                "rel_path": "sparse/only.py",
                "kind": "function",
                "symbol": "",
                "line_start": 1,
                "line_end": 10,
                "source_kind": "code",
            },
        }
    ]
    bm25 = BM25Index()
    bm25.rebuild_from_chroma(_FakeStore(docs))

    retriever = HybridRetriever(vector, _StubGraph(), bm25=bm25)
    ctx = retriever.retrieve("회원가입", k=4)
    paths = {c.rel_path for c in ctx.chunks}
    assert "dense/only.py" in paths
    assert "sparse/only.py" not in paths, "BM25 must stay silent when flag is off"
    get_settings.cache_clear()
