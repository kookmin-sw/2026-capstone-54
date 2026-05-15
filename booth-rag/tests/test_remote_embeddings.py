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
    emb = RemoteHuggingFaceEmbeddings.__new__(RemoteHuggingFaceEmbeddings)
    emb._base_url = "http://stub"
    emb._batch_size = 3
    emb._client = httpx.Client(transport=transport, base_url="http://stub")
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
