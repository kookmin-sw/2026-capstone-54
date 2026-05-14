from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from booth_rag.rag.chains import ChatTurn

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    session_id: str
    message: str


def _store(req: Request):
    return req.app.state.session_store


def _rag(req: Request):
    return req.app.state.rag_service


@router.post("")
async def chat_stream(payload: ChatRequest, req: Request) -> EventSourceResponse:
    session = await _store(req).get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="message must not be empty")

    messages_before = await _store(req).list_messages(payload.session_id)
    history = [ChatTurn(role=m.role, content=m.content) for m in messages_before]
    await _store(req).add_message(payload.session_id, "user", user_message)

    chain = _rag(req).chain

    async def event_gen():
        full_text_parts: list[str] = []
        try:
            async for token in chain.answer_stream(history, user_message):
                full_text_parts.append(token)
                yield {"event": "token", "data": json.dumps({"text": token})}
        except Exception as exc:
            yield {"event": "error", "data": json.dumps({"error": str(exc)})}
            return

        final_text = "".join(full_text_parts)
        ctx = chain._retriever.retrieve(user_message)
        citations: list[str] = []
        seen: set[str] = set()
        for c in ctx.chunks:
            if c.rel_path and c.rel_path not in seen:
                citations.append(c.rel_path)
                seen.add(c.rel_path)
            if len(citations) >= 3:
                break

        await _store(req).add_message(
            payload.session_id,
            "assistant",
            final_text,
            citations=json.dumps(citations, ensure_ascii=False) if citations else None,
        )

        if len(messages_before) == 0:
            title = (user_message[:30] + "…") if len(user_message) > 30 else user_message
            await _store(req).rename_session(payload.session_id, title)

        yield {
            "event": "done",
            "data": json.dumps({"citations": citations}, ensure_ascii=False),
        }

    return EventSourceResponse(event_gen())
