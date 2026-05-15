from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from booth_rag.rag.reranker import CrossEncoderReranker


@dataclass
class _StubChunk:
    text: str


class _FakeCrossEncoder:
    def __init__(self, *_args: Any, **_kwargs: Any) -> None:
        self.calls: list[list[tuple[str, str]]] = []

    def predict(self, pairs: list[tuple[str, str]], **_: Any):
        self.calls.append(pairs)
        return [float(len(b)) for _, b in pairs]


def _make_reranker(monkeypatch, fake: _FakeCrossEncoder | None = None) -> CrossEncoderReranker:
    fake = fake or _FakeCrossEncoder()
    monkeypatch.setattr(
        "sentence_transformers.CrossEncoder",
        lambda *_args, **_kwargs: fake,
        raising=False,
    )
    return CrossEncoderReranker(model_name="fake/model", device_pref="cpu")


def test_rerank_returns_input_when_query_empty(monkeypatch):
    rr = _make_reranker(monkeypatch)
    chunks = [_StubChunk(text="a"), _StubChunk(text="bb")]
    assert rr.rerank("", chunks) == chunks
    assert rr.rerank("   ", chunks) == chunks


def test_rerank_returns_input_when_chunks_empty(monkeypatch):
    rr = _make_reranker(monkeypatch)
    assert rr.rerank("q", []) == []


def test_rerank_orders_by_score_descending(monkeypatch):
    rr = _make_reranker(monkeypatch)
    chunks = [
        _StubChunk(text="x"),
        _StubChunk(text="xxxx"),
        _StubChunk(text="xx"),
    ]
    out = rr.rerank("question", chunks)
    assert [c.text for c in out] == ["xxxx", "xx", "x"]


def test_rerank_truncates_to_top_k(monkeypatch):
    rr = _make_reranker(monkeypatch)
    chunks = [_StubChunk(text="a" * i) for i in range(1, 11)]
    out = rr.rerank("q", chunks, top_k=3)
    assert len(out) == 3
    assert out[0].text == "a" * 10


def test_rerank_graceful_when_model_load_fails(monkeypatch):
    def _raises(*_args, **_kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr("sentence_transformers.CrossEncoder", _raises, raising=False)
    rr = CrossEncoderReranker(model_name="bad/model", device_pref="cpu")
    chunks = [_StubChunk(text="a"), _StubChunk(text="b")]
    assert rr.rerank("q", chunks) == chunks
    assert rr.ready is False


def test_rerank_graceful_when_predict_raises(monkeypatch):
    class _BadEncoder:
        def predict(self, *_args, **_kwargs):
            raise RuntimeError("model crashed mid-inference")

    monkeypatch.setattr(
        "sentence_transformers.CrossEncoder",
        lambda *_args, **_kwargs: _BadEncoder(),
        raising=False,
    )
    rr = CrossEncoderReranker(model_name="fake", device_pref="cpu")
    chunks = [_StubChunk(text="a"), _StubChunk(text="b")]
    assert rr.rerank("q", chunks) == chunks


def test_rerank_invoked_lazily_only_on_first_call(monkeypatch):
    instantiations = []

    class _CountingEncoder:
        def __init__(self, *args, **kwargs):
            instantiations.append((args, kwargs))

        def predict(self, pairs, **_):
            return [float(i) for i in range(len(pairs))]

    monkeypatch.setattr("sentence_transformers.CrossEncoder", _CountingEncoder, raising=False)
    rr = CrossEncoderReranker(model_name="fake", device_pref="cpu")
    assert instantiations == []
    rr.rerank("q", [_StubChunk(text="a")])
    rr.rerank("q", [_StubChunk(text="b")])
    assert len(instantiations) == 1
