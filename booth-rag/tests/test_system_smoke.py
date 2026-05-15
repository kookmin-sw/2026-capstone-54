"""End-to-end smoke tests that exercise the FastAPI app against fake services.

The fake RAG service mirrors the production singleton interface but never
loads sentence-transformers or contacts the embedding server. This keeps the
suite under one second while still proving that wiring (sessions, chat SSE,
admin guards, embedding service contract) is correct.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from langchain_core.embeddings import Embeddings

from booth_rag import main as main_module
from booth_rag.db.session_store import SessionStore
from booth_rag.rag.chains import ChatTurn
from booth_rag.server import embedding_service


@dataclass
class _FakeProgress:
    phase: str
    current: int
    total: int
    message: str

    @property
    def pct(self) -> float:
        return (self.current / self.total * 100.0) if self.total else 0.0


class _FakeChain:
    def __init__(self, reply: str = "테스트 응답"):
        self.reply = reply
        self.last_history: list[ChatTurn] | None = None
        self.last_question: str | None = None
        self.followups: list[str] = ["미핏 어디서 시작?", "Pro 요금 혜택?", "표정 분석 모델?"]

    async def answer_stream(
        self,
        history: list[ChatTurn],
        question: str,
        context=None,
    ) -> AsyncIterator[str]:
        self.last_history = history
        self.last_question = question
        for token in self.reply:
            yield token

    async def generate_followups(self, _question: str, _answer: str, n: int = 3) -> list[str]:
        return list(self.followups[:n])

    async def rewrite_query_for_retrieval(
        self,
        _history: list[ChatTurn],
        question: str,
    ) -> str:
        return question

    async def expand_queries(self, question: str, n: int = 3) -> list[str]:
        return [question]

    async def hypothetical_passages(self, _question: str, n: int = 2) -> list[str]:
        return []


class _FakeRetriever:
    def retrieve(self, _query: str, **_kwargs):
        @dataclass
        class _Ctx:
            chunks: list = ()
            graph_neighbors: list = ()
            queries_used: list = ()

        return _Ctx()


class _FakeRagService:
    def __init__(self) -> None:
        self.reply = "RAG 테스트 응답입니다."
        self._chain = _FakeChain(self.reply)
        self._chain._retriever = _FakeRetriever()  # type: ignore[attr-defined]
        self.last_progress: _FakeProgress | None = None
        self.is_ingesting = False

    @property
    def chain(self):
        return self._chain

    @property
    def embedding_info(self) -> dict[str, object]:
        return {"model": "fake/test", "device": "cpu", "dimension": 4}

    def stats(self) -> dict[str, object]:
        out: dict[str, object] = {
            "openai_chat_enabled": False,
            "is_ingesting": self.is_ingesting,
            "vector_count": 0,
            "collection": "booth_rag_chunks",
            "embedding_model": "fake/test",
            "embedding_device": "cpu",
            "embedding_dimension": 4,
            "graph_nodes": 0,
            "graph_edges": 0,
        }
        if self.last_progress is not None:
            out["last_progress"] = {
                "phase": self.last_progress.phase,
                "current": self.last_progress.current,
                "total": self.last_progress.total,
                "pct": self.last_progress.pct,
                "message": self.last_progress.message,
            }
        return out

    def ingest_codebase(self, **_kwargs: Any) -> Any:
        self.last_progress = _FakeProgress("done", 0, 0, "noop")
        return None

    def ingest_document_path(self, _path: Path, **_kwargs: Any) -> Any:
        @dataclass
        class _S:
            chunks_indexed: int = 0

        return _S()

    def reset_index(self) -> None:
        self.last_progress = None


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setattr("booth_rag.config.DATA_DIR", tmp_path, raising=False)
    from booth_rag.config import get_settings

    get_settings.cache_clear()
    monkeypatch.setenv("ADMIN_TOKEN", "test-token")
    get_settings.cache_clear()

    rag = _FakeRagService()
    store = SessionStore(tmp_path / "chat.db")
    asyncio.get_event_loop_policy().new_event_loop().run_until_complete(store.init())

    async def _lifespan(app):  # type: ignore[no-untyped-def]
        from fastapi.templating import Jinja2Templates

        app.state.session_store = store
        app.state.rag_service = rag
        app.state.templates = Jinja2Templates(directory=str(main_module.TEMPLATES_DIR))
        yield

    monkeypatch.setattr(main_module, "_lifespan", _lifespan)
    app = main_module.create_app()
    with TestClient(app) as c:
        c.fake_rag = rag  # type: ignore[attr-defined]
        yield c


def test_health_reports_index_metadata(client: TestClient):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["embedding_model"] == "fake/test"
    assert body["collection"] == "booth_rag_chunks"


def test_root_renders_korean_brand(client: TestClient):
    r = client.get("/")
    assert r.status_code == 200
    assert "미핏 부스 안내" in r.text
    assert "54팀" in r.text


def test_admin_status_requires_token(client: TestClient):
    r = client.get("/api/admin/status")
    assert r.status_code == 401
    r2 = client.get("/api/admin/status", headers={"X-Admin-Token": "wrong"})
    assert r2.status_code == 401


def test_admin_status_with_correct_token(client: TestClient):
    r = client.get("/api/admin/status", headers={"X-Admin-Token": "test-token"})
    assert r.status_code == 200
    assert r.json()["embedding_model"] == "fake/test"


def test_admin_reset_clears_progress(client: TestClient):
    rag: _FakeRagService = client.fake_rag  # type: ignore[attr-defined]
    rag.last_progress = _FakeProgress("done", 10, 10, "completed")
    r = client.post("/api/admin/reset", headers={"X-Admin-Token": "test-token"})
    assert r.status_code == 200
    assert rag.last_progress is None


def test_session_lifecycle(client: TestClient):
    r = client.post("/api/sessions", json={"title": "smoke"})
    assert r.status_code == 200
    session_id = r.json()["id"]

    r = client.get("/api/sessions")
    assert any(s["id"] == session_id for s in r.json()["sessions"])

    r = client.get(f"/api/sessions/{session_id}")
    assert r.status_code == 200
    assert r.json()["session"]["title"] == "smoke"

    r = client.patch(f"/api/sessions/{session_id}", json={"title": "renamed"})
    assert r.status_code == 200

    r = client.delete(f"/api/sessions/{session_id}")
    assert r.status_code == 200

    r = client.get(f"/api/sessions/{session_id}")
    assert r.status_code == 404


def test_chat_sse_streams_fake_reply_and_persists(client: TestClient):
    session_id = client.post("/api/sessions", json={"title": "chat"}).json()["id"]
    with client.stream(
        "POST",
        "/api/chat",
        json={"session_id": session_id, "message": "안녕하세요"},
    ) as r:
        assert r.status_code == 200
        body = "".join(chunk.decode() for chunk in r.iter_bytes())
    assert "token" in body
    assert "done" in body

    msgs = client.get(f"/api/sessions/{session_id}").json()["messages"]
    roles = [m["role"] for m in msgs]
    assert roles == ["user", "assistant"]
    assert msgs[1]["content"] == "RAG 테스트 응답입니다."


def test_chat_rejects_empty_message(client: TestClient):
    session_id = client.post("/api/sessions", json={"title": "x"}).json()["id"]
    r = client.post("/api/chat", json={"session_id": session_id, "message": "   "})
    assert r.status_code == 400


def test_chat_rejects_unknown_session(client: TestClient):
    r = client.post(
        "/api/chat",
        json={"session_id": "does-not-exist", "message": "hi"},
    )
    assert r.status_code == 404


class _DummyServerEmb(Embeddings):
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [[float(i)] * 4 for i in range(len(texts))]

    def embed_query(self, _text: str) -> list[float]:
        return [9.0, 9.0, 9.0, 9.0]


@pytest.fixture
def embedding_app(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(
        embedding_service,
        "_build_server_embeddings",
        lambda: _DummyServerEmb(),
    )
    return embedding_service.create_app()


def test_embedding_service_info_round_trip(embedding_app):
    with TestClient(embedding_app) as c:
        r = c.get("/info")
        assert r.status_code == 200
        info = r.json()
        assert info["dimension"] == 4
        assert info["backend"] == "local"


def test_embedding_service_documents_and_query(embedding_app):
    with TestClient(embedding_app) as c:
        r = c.post("/embed/documents", json={"texts": ["a", "b", "c"]})
        assert r.status_code == 200
        body = r.json()
        assert body["count"] == 3
        assert body["dimension"] == 4
        assert len(body["embeddings"]) == 3

        r = c.post("/embed/query", json={"text": "hi"})
        assert r.status_code == 200
        body = r.json()
        assert body["embedding"] == [9.0, 9.0, 9.0, 9.0]
        assert body["dimension"] == 4
