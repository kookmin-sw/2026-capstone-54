from __future__ import annotations

import asyncio
import json
import logging
import time

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from booth_rag.config import get_settings
from booth_rag.rag.chains import ChatTurn
from booth_rag.rag.retriever import HybridContext

logger = logging.getLogger(__name__)

_SOURCE_EXCERPT_CHARS = 1200
_MAX_SOURCES = 6

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    session_id: str
    message: str


def _store(req: Request):
    return req.app.state.session_store


def _rag(req: Request):
    return req.app.state.rag_service


async def _passthrough(value):
    return value


def _serialise_sources(context: HybridContext) -> list[dict[str, object]]:
    seen: set[tuple[str, int, int]] = set()
    out: list[dict[str, object]] = []
    for c in context.chunks:
        key = (c.rel_path, c.line_start, c.line_end)
        if key in seen:
            continue
        seen.add(key)
        out.append(
            {
                "rel_path": c.rel_path,
                "line_start": c.line_start,
                "line_end": c.line_end,
                "kind": c.kind,
                "symbol": c.symbol,
                "source_kind": c.source_kind,
                "score": round(c.score, 4),
                "text": (c.text or "")[:_SOURCE_EXCERPT_CHARS],
            }
        )
        if len(out) >= _MAX_SOURCES:
            break
    return out


def _citation_paths(sources: list[dict[str, object]]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for s in sources:
        path = str(s.get("rel_path") or "")
        if path and path not in seen:
            seen.add(path)
            out.append(path)
        if len(out) >= 3:
            break
    return out


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
    settings = get_settings()

    retrieval_started = time.perf_counter()
    if settings.rag_rewrite_query and history:
        search_question = await chain.rewrite_query_for_retrieval(history, user_message)
    else:
        search_question = user_message
    expand_coro: object = (
        chain.expand_queries(search_question, n=3)
        if settings.rag_expand_queries
        else _passthrough([search_question])
    )
    hyde_coro: object = (
        chain.hypothetical_passages(search_question, n=settings.rag_hyde_n)
        if settings.rag_hyde_enabled and settings.rag_hyde_n > 0
        else _passthrough([])
    )
    query_variants, hypothetical = await asyncio.gather(expand_coro, hyde_coro)
    all_probes = [*query_variants, *hypothetical]
    context: HybridContext = await asyncio.to_thread(
        chain._retriever.retrieve, search_question, queries=all_probes
    )
    retrieval_ms = (time.perf_counter() - retrieval_started) * 1000.0

    async def event_gen():
        yield {
            "event": "retrieval",
            "data": json.dumps(
                {"queries": list(context.queries_used), "elapsed_ms": round(retrieval_ms, 1)},
                ensure_ascii=False,
            ),
        }
        full_text_parts: list[str] = []
        llm_started = time.perf_counter()
        try:
            async for token in chain.answer_stream(history, user_message, context=context):
                full_text_parts.append(token)
                yield {"event": "token", "data": json.dumps({"text": token})}
        except Exception as exc:
            yield {"event": "error", "data": json.dumps({"error": str(exc)})}
            return
        llm_ms = (time.perf_counter() - llm_started) * 1000.0
        total_ms = retrieval_ms + llm_ms

        final_text = "".join(full_text_parts)
        sources = _serialise_sources(context)
        citations = _citation_paths(sources)
        metrics = {
            "retrieval_ms": round(retrieval_ms, 1),
            "llm_ms": round(llm_ms, 1),
            "total_ms": round(total_ms, 1),
            "queries_used": list(context.queries_used),
        }

        persisted_payload = {"citations": citations, "sources": sources, "metrics": metrics}
        await _store(req).add_message(
            payload.session_id,
            "assistant",
            final_text,
            citations=json.dumps(persisted_payload, ensure_ascii=False),
        )

        if len(messages_before) == 0:
            title = (user_message[:30] + "…") if len(user_message) > 30 else user_message
            await _store(req).rename_session(payload.session_id, title)

        yield {
            "event": "done",
            "data": json.dumps(
                {"citations": citations, "sources": sources, "metrics": metrics},
                ensure_ascii=False,
            ),
        }

        try:
            followups = await chain.generate_followups(user_message, final_text, n=3)
        except Exception as exc:
            logger.warning("followup generation failed: %s", exc)
            followups = []
        if followups:
            persisted = await _store(req).list_messages(payload.session_id)
            last_assistant = next(
                (m for m in reversed(persisted) if m.role == "assistant"),
                None,
            )
            if last_assistant is not None:
                try:
                    body = json.loads(last_assistant.citations or "{}")
                except json.JSONDecodeError:
                    body = {}
                body["followups"] = followups
                await _store(req).update_message_citations(
                    last_assistant.id,
                    json.dumps(body, ensure_ascii=False),
                )
        yield {
            "event": "followups",
            "data": json.dumps({"followups": followups}, ensure_ascii=False),
        }

    return EventSourceResponse(event_gen())
