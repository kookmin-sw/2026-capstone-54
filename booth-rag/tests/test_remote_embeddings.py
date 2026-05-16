from __future__ import annotations

import json
from typing import Any

import httpx
import pytest

from booth_rag.rag.embeddings import RemoteHuggingFaceEmbeddings, describe_embeddings


class _MockTransport(httpx.BaseTransport):
    def __init__(self, *, model: str = "fake/model", dim: int = 4):
        self.calls: list[dict[str, Any]] = []
        self._model = model
        self._dim = dim

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        path = request.url.path
        body = json.loads(request.content.decode()) if request.content else {}
        self.calls.append({"path": path, "method": request.method, "body": body})

        if path == "/info" and request.method == "GET":
            return httpx.Response(
                200,
                json={
                    "model": self._model,
                    "dimension": self._dim,
                    "device": "cpu",
                    "backend": "local",
                },
            )
        if path == "/embed/documents" and request.method == "POST":
            texts = body.get("texts") or []
            return httpx.Response(
                200,
                json={
                    "embeddings": [[0.1] * self._dim for _ in texts],
                    "count": len(texts),
                    "dimension": self._dim,
                    "elapsed_ms": 1.0,
                },
            )
        if path == "/embed/query" and request.method == "POST":
            return httpx.Response(
                200,
                json={
                    "embedding": [0.9] * self._dim,
                    "dimension": self._dim,
                    "elapsed_ms": 1.0,
                },
            )
        return httpx.Response(404, json={"error": f"unknown {path}"})


def _make_client(transport: _MockTransport) -> RemoteHuggingFaceEmbeddings:
    from booth_rag.rag.embeddings import _LruEmbeddingCache

    emb = RemoteHuggingFaceEmbeddings.__new__(RemoteHuggingFaceEmbeddings)
    emb._base_url = "http://stub"
    emb._batch_size = 3
    emb._client = httpx.Client(transport=transport, base_url="http://stub")
    emb._cache = _LruEmbeddingCache()
    info = emb._handshake()
    emb.model_name = str(info["model"])
    emb._dimension = int(info["dimension"])
    emb._device = str(info.get("device", "remote"))
    return emb


def test_handshake_populates_metadata():
    transport = _MockTransport(model="BAAI/bge-m3", dim=1024)
    emb = _make_client(transport)
    assert emb.model_name == "BAAI/bge-m3"
    assert emb.dimension == 1024
    assert emb.device_label == "cpu"
    assert transport.calls[0]["path"] == "/info"


def test_embed_query_calls_query_endpoint():
    transport = _MockTransport(dim=4)
    emb = _make_client(transport)
    vec = emb.embed_query("hello")
    assert vec == [0.9, 0.9, 0.9, 0.9]
    query_calls = [c for c in transport.calls if c["path"] == "/embed/query"]
    assert len(query_calls) == 1
    assert query_calls[0]["body"] == {"text": "hello"}


def test_embed_documents_batches():
    transport = _MockTransport(dim=4)
    emb = _make_client(transport)
    vectors = emb.embed_documents(["a", "b", "c", "d", "e", "f", "g"])
    assert len(vectors) == 7
    assert all(len(v) == 4 for v in vectors)
    doc_calls = [c for c in transport.calls if c["path"] == "/embed/documents"]
    assert len(doc_calls) == 3
    assert [len(c["body"]["texts"]) for c in doc_calls] == [3, 3, 1]


def test_embed_documents_empty_no_http_call():
    transport = _MockTransport()
    emb = _make_client(transport)
    transport.calls.clear()
    assert emb.embed_documents([]) == []
    assert transport.calls == []


def test_embed_query_cache_hit_skips_http():
    transport = _MockTransport(dim=4)
    emb = _make_client(transport)
    emb.embed_query("hello")
    before = len(transport.calls)
    again = emb.embed_query("hello")
    assert again == [0.9, 0.9, 0.9, 0.9]
    assert len(transport.calls) == before


def test_embed_documents_cache_hit_skips_already_seen():
    transport = _MockTransport(dim=4)
    emb = _make_client(transport)
    emb.embed_documents(["x", "y"])
    transport.calls.clear()
    vectors = emb.embed_documents(["x", "z", "y"])
    assert len(vectors) == 3
    doc_calls = [c for c in transport.calls if c["path"] == "/embed/documents"]
    assert len(doc_calls) == 1
    assert doc_calls[0]["body"]["texts"] == ["z"]


def test_describe_embeddings_uses_remote_metadata():
    transport = _MockTransport(model="BAAI/bge-m3", dim=1024)
    emb = _make_client(transport)
    transport.calls.clear()
    info = describe_embeddings(emb)
    assert info.model == "BAAI/bge-m3"
    assert info.dimension == 1024
    assert info.device.startswith("remote:")
    assert transport.calls == []


def test_handshake_failure_raises_helpful_error():
    class FailingTransport(httpx.BaseTransport):
        def handle_request(self, request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("connection refused")

    emb = RemoteHuggingFaceEmbeddings.__new__(RemoteHuggingFaceEmbeddings)
    emb._base_url = "http://nope"
    emb._batch_size = 8
    emb._client = httpx.Client(transport=FailingTransport(), base_url="http://nope")
    with pytest.raises(RuntimeError) as exc:
        emb._handshake()
    msg = str(exc.value)
    assert "원격 임베딩 서버 연결 실패" in msg
    assert "run_embedding_server" in msg


def test_build_code_embeddings_uses_remote_when_url_set(monkeypatch):
    from booth_rag.config import get_settings
    from booth_rag.rag import embeddings as embeddings_module

    get_settings.cache_clear()
    monkeypatch.setenv("EMBEDDING_BACKEND", "remote")
    monkeypatch.setenv("REMOTE_EMBEDDING_CODE_URL", "http://stub-code:8081")

    constructed: list[dict[str, Any]] = []

    def _stub_remote(base_url, *, timeout, batch_size):
        constructed.append({"base_url": base_url, "timeout": timeout, "batch_size": batch_size})
        return "REMOTE_STUB"

    monkeypatch.setattr(embeddings_module, "RemoteHuggingFaceEmbeddings", _stub_remote)
    monkeypatch.setattr(
        embeddings_module,
        "_build_local_embeddings",
        lambda **_: pytest.fail("must not fall back to local when code URL is set"),
    )

    out = embeddings_module.build_code_embeddings()
    assert out == "REMOTE_STUB"
    assert len(constructed) == 1
    assert constructed[0]["base_url"] == "http://stub-code:8081"
    get_settings.cache_clear()


def test_build_code_embeddings_falls_back_to_local_when_url_empty(monkeypatch):
    from booth_rag.config import get_settings
    from booth_rag.rag import embeddings as embeddings_module

    get_settings.cache_clear()
    monkeypatch.setenv("EMBEDDING_BACKEND", "remote")
    monkeypatch.setenv("REMOTE_EMBEDDING_CODE_URL", "")

    local_calls: list[dict[str, Any]] = []

    def _stub_local(*, model_name=None, trust_remote_code=None, role="doc"):
        local_calls.append({"model_name": model_name, "trust_remote_code": trust_remote_code, "role": role})
        return "LOCAL_STUB"

    monkeypatch.setattr(embeddings_module, "_build_local_embeddings", _stub_local)
    monkeypatch.setattr(
        embeddings_module,
        "RemoteHuggingFaceEmbeddings",
        lambda *_a, **_kw: pytest.fail("must not use remote when code URL is empty"),
    )

    out = embeddings_module.build_code_embeddings()
    assert out == "LOCAL_STUB"
    assert local_calls[0]["role"] == "code"
    get_settings.cache_clear()


def test_build_code_embeddings_uses_local_when_backend_local(monkeypatch):
    from booth_rag.config import get_settings
    from booth_rag.rag import embeddings as embeddings_module

    get_settings.cache_clear()
    monkeypatch.setenv("EMBEDDING_BACKEND", "local")
    monkeypatch.setenv("REMOTE_EMBEDDING_CODE_URL", "http://should-not-matter:8081")

    monkeypatch.setattr(embeddings_module, "_build_local_embeddings", lambda **_: "LOCAL_STUB")
    monkeypatch.setattr(
        embeddings_module,
        "RemoteHuggingFaceEmbeddings",
        lambda *_a, **_kw: pytest.fail("local backend must never hit remote"),
    )

    out = embeddings_module.build_code_embeddings()
    assert out == "LOCAL_STUB"
    get_settings.cache_clear()


def test_build_code_embeddings_calls_prewarm_on_local_path(monkeypatch):
    from booth_rag.config import get_settings
    from booth_rag.rag import embeddings as embeddings_module

    get_settings.cache_clear()
    monkeypatch.setenv("EMBEDDING_BACKEND", "local")

    class _FakeEmb:
        def __init__(self):
            self.embed_query_calls: list[str] = []

        def embed_query(self, text: str) -> list[float]:
            self.embed_query_calls.append(text)
            return [0.0]

    fake = _FakeEmb()
    monkeypatch.setattr(embeddings_module, "_build_local_embeddings", lambda **_: fake)

    out = embeddings_module.build_code_embeddings()
    assert out is fake
    assert len(fake.embed_query_calls) == 1
    assert len(fake.embed_query_calls[0]) > 1000
    get_settings.cache_clear()


def test_build_code_embeddings_prewarm_failure_is_non_fatal(monkeypatch):
    from booth_rag.config import get_settings
    from booth_rag.rag import embeddings as embeddings_module

    get_settings.cache_clear()
    monkeypatch.setenv("EMBEDDING_BACKEND", "local")

    class _BadEmb:
        def embed_query(self, text: str) -> list[float]:
            raise RuntimeError("prewarm boom")

    bad = _BadEmb()
    monkeypatch.setattr(embeddings_module, "_build_local_embeddings", lambda **_: bad)

    out = embeddings_module.build_code_embeddings()
    assert out is bad
    get_settings.cache_clear()


def test_build_code_embeddings_remote_path_skips_prewarm(monkeypatch):
    from booth_rag.config import get_settings
    from booth_rag.rag import embeddings as embeddings_module

    get_settings.cache_clear()
    monkeypatch.setenv("EMBEDDING_BACKEND", "remote")
    monkeypatch.setenv("REMOTE_EMBEDDING_CODE_URL", "http://stub:8081")

    class _RemoteStub:
        def __init__(self, *a, **kw):
            self.embed_query_calls: list[str] = []

        def embed_query(self, text: str) -> list[float]:
            self.embed_query_calls.append(text)
            return [0.0]

    stub = _RemoteStub()
    monkeypatch.setattr(embeddings_module, "RemoteHuggingFaceEmbeddings", lambda *a, **kw: stub)
    monkeypatch.setattr(
        embeddings_module,
        "_build_local_embeddings",
        lambda **_: pytest.fail("remote path must not build local"),
    )

    out = embeddings_module.build_code_embeddings()
    assert out is stub
    assert stub.embed_query_calls == []
    get_settings.cache_clear()
