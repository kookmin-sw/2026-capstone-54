from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class CreateSessionRequest(BaseModel):
    title: str | None = None


class RenameSessionRequest(BaseModel):
    title: str


def _store(req: Request):
    return req.app.state.session_store


@router.get("")
async def list_sessions(req: Request):
    sessions = await _store(req).list_sessions()
    return {"sessions": [asdict(s) for s in sessions]}


@router.post("")
async def create_session(payload: CreateSessionRequest, req: Request):
    session = await _store(req).create_session(payload.title or "새 대화")
    return asdict(session)


@router.get("/{session_id}")
async def get_session(session_id: str, req: Request):
    session = await _store(req).get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = await _store(req).list_messages(session_id)
    return {
        "session": asdict(session),
        "messages": [asdict(m) for m in messages],
    }


@router.delete("/{session_id}")
async def delete_session(session_id: str, req: Request):
    ok = await _store(req).delete_session(session_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}


@router.patch("/{session_id}")
async def rename_session(session_id: str, payload: RenameSessionRequest, req: Request):
    ok = await _store(req).rename_session(session_id, payload.title)
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"renamed": True}
