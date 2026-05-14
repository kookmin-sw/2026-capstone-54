"""SQLite-backed conversation session and message store."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import aiosqlite

_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, id);
"""


@dataclass
class Session:
    id: str
    title: str
    created_at: str
    updated_at: str


@dataclass
class Message:
    id: int
    session_id: str
    role: str
    content: str
    citations: str | None
    created_at: str


def _now() -> str:
    return datetime.now(UTC).isoformat()


class SessionStore:
    def __init__(self, db_path: Path):
        self._db_path = db_path

    async def init(self) -> None:
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiosqlite.connect(self._db_path) as db:
            await db.executescript(_SCHEMA)
            await db.commit()

    async def create_session(self, title: str = "새 대화") -> Session:
        session_id = uuid.uuid4().hex
        now = _now()
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute(
                "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (session_id, title, now, now),
            )
            await db.commit()
        return Session(id=session_id, title=title, created_at=now, updated_at=now)

    async def list_sessions(self, limit: int = 50) -> list[Session]:
        async with aiosqlite.connect(self._db_path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT id, title, created_at, updated_at FROM sessions ORDER BY updated_at DESC LIMIT ?",
                (limit,),
            )
            rows = await cur.fetchall()
        return [Session(**dict(row)) for row in rows]

    async def get_session(self, session_id: str) -> Session | None:
        async with aiosqlite.connect(self._db_path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT id, title, created_at, updated_at FROM sessions WHERE id = ?",
                (session_id,),
            )
            row = await cur.fetchone()
        return Session(**dict(row)) if row else None

    async def delete_session(self, session_id: str) -> bool:
        async with aiosqlite.connect(self._db_path) as db:
            await db.execute("PRAGMA foreign_keys = ON")
            cur = await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
            await db.commit()
            return cur.rowcount > 0

    async def rename_session(self, session_id: str, title: str) -> bool:
        async with aiosqlite.connect(self._db_path) as db:
            cur = await db.execute(
                "UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?",
                (title, _now(), session_id),
            )
            await db.commit()
            return cur.rowcount > 0

    async def add_message(self, session_id: str, role: str, content: str, citations: str | None = None) -> Message:
        now = _now()
        async with aiosqlite.connect(self._db_path) as db:
            cur = await db.execute(
                "INSERT INTO messages (session_id, role, content, citations, created_at) VALUES (?, ?, ?, ?, ?)",
                (session_id, role, content, citations, now),
            )
            await db.execute(
                "UPDATE sessions SET updated_at = ? WHERE id = ?",
                (now, session_id),
            )
            await db.commit()
            message_id = cur.lastrowid
        return Message(
            id=message_id or 0,
            session_id=session_id,
            role=role,
            content=content,
            citations=citations,
            created_at=now,
        )

    async def list_messages(self, session_id: str) -> list[Message]:
        async with aiosqlite.connect(self._db_path) as db:
            db.row_factory = aiosqlite.Row
            cur = await db.execute(
                "SELECT id, session_id, role, content, citations, created_at "
                "FROM messages WHERE session_id = ? ORDER BY id ASC",
                (session_id,),
            )
            rows = await cur.fetchall()
        return [Message(**dict(row)) for row in rows]
