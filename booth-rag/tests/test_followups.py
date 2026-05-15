from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from booth_rag.rag import chains as chains_module
from booth_rag.rag.chains import ChatChain


class _StubMessage:
    def __init__(self, content: str):
        self.content = content


def _make_chain_with_llm(content: str) -> ChatChain:
    chain = ChatChain.__new__(ChatChain)
    chain._retriever = None  # type: ignore[attr-defined]
    chain._settings = None  # type: ignore[attr-defined]
    chain._llm = AsyncMock()
    chain._llm.ainvoke = AsyncMock(return_value=_StubMessage(content))
    return chain


def test_parse_followups_extracts_json_object():
    raw = '여기 추천: {"followups": ["면접 티켓 흐름?", "표정 분석 정확도?", "Pro 요금 차이?"]}'
    out = chains_module._parse_followups(raw, n=3)
    assert out == ["면접 티켓 흐름?", "표정 분석 정확도?", "Pro 요금 차이?"]


def test_parse_followups_strips_numbered_list_fallback():
    raw = """답변에 이은 후속:
    1. 미핏 백엔드 구조는 어떻게 돼요?
    - 표정 분석은 어떤 모델을 쓰나요?
    * Pro 요금제 혜택이 뭐예요?
    """
    out = chains_module._parse_followups(raw, n=3)
    assert len(out) == 3
    assert all(q.endswith("?") for q in out)


def test_parse_followups_deduplicates():
    raw = '{"followups": ["같은 질문?", "같은 질문?", "다른 질문?"]}'
    out = chains_module._parse_followups(raw, n=3)
    assert out == ["같은 질문?", "다른 질문?"]


def test_parse_followups_empty_when_no_question_marks():
    raw = "이건 후속 질문이 아닙니다.\n그냥 일반 텍스트."
    assert chains_module._parse_followups(raw, n=3) == []


def test_parse_followups_caps_at_n():
    raw = '{"followups": ["a?", "b?", "c?", "d?", "e?"]}'
    out = chains_module._parse_followups(raw, n=3)
    assert out == ["a?", "b?", "c?"]


@pytest.mark.asyncio
async def test_generate_followups_uses_llm_and_parses():
    chain = _make_chain_with_llm('{"followups": ["Q1?", "Q2?", "Q3?"]}')
    result = await chain.generate_followups("질문", "답변", n=3)
    assert result == ["Q1?", "Q2?", "Q3?"]
    chain._llm.ainvoke.assert_awaited_once()


@pytest.mark.asyncio
async def test_generate_followups_returns_empty_on_exception():
    chain = ChatChain.__new__(ChatChain)
    chain._retriever = None  # type: ignore[attr-defined]
    chain._settings = None  # type: ignore[attr-defined]
    chain._llm = AsyncMock()
    chain._llm.ainvoke = AsyncMock(side_effect=RuntimeError("network down"))
    assert await chain.generate_followups("q", "a", n=3) == []


@pytest.mark.asyncio
async def test_generate_followups_skips_when_no_llm():
    chain = ChatChain.__new__(ChatChain)
    chain._retriever = None  # type: ignore[attr-defined]
    chain._settings = None  # type: ignore[attr-defined]
    chain._llm = None
    assert await chain.generate_followups("q", "a", n=3) == []
