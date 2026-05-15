from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from booth_rag.rag import chains as chains_module
from booth_rag.rag.chains import ChatChain, ChatTurn
from booth_rag.rag.retriever import _intent_boost_factor, reciprocal_rank_fusion
from booth_rag.rag.vector_store import RetrievedChunk


def _chunk(
    rel: str, line_start: int = 1, line_end: int = 10, symbol: str | None = None, text: str = "x"
) -> RetrievedChunk:
    return RetrievedChunk(
        rel_path=rel,
        text=text,
        score=0.5,
        kind="generic",
        symbol=symbol,
        line_start=line_start,
        line_end=line_end,
        source_kind="code",
    )


class _StubMessage:
    def __init__(self, content: str):
        self.content = content


def _chain_with_llm(content: str) -> ChatChain:
    chain = ChatChain.__new__(ChatChain)
    chain._retriever = None  # type: ignore[attr-defined]
    chain._settings = None  # type: ignore[attr-defined]
    chain._llm = AsyncMock()
    chain._llm.ainvoke = AsyncMock(return_value=_StubMessage(content))
    return chain


def test_rrf_fuses_overlapping_results_and_boosts_shared_top_ranks():
    list_a = [_chunk("a.py"), _chunk("b.py"), _chunk("c.py")]
    list_b = [_chunk("b.py"), _chunk("d.py"), _chunk("a.py")]
    fused = reciprocal_rank_fusion([list_a, list_b], rrf_k=60, top_k=5)
    paths = [c.rel_path for c in fused]
    assert paths[0] in {"a.py", "b.py"}, "shared top ranks should rise"
    assert paths[1] in {"a.py", "b.py"}
    assert "c.py" in paths
    assert "d.py" in paths


def test_rrf_dedupes_same_chunk_signature():
    same = _chunk("x.py", line_start=10, line_end=20, symbol="run")
    fused = reciprocal_rank_fusion([[same], [same], [same]], rrf_k=60, top_k=3)
    assert len(fused) == 1
    assert fused[0].score == pytest.approx(3.0 / (60 + 1))


def test_rrf_respects_top_k_cap():
    lists = [[_chunk(f"f{i}.py") for i in range(10)]]
    fused = reciprocal_rank_fusion(lists, rrf_k=60, top_k=3)
    assert len(fused) == 3


def test_intent_boost_structure_query_prefers_outline_and_summary():
    assert _intent_boost_factor("백엔드 모듈 구성?", "outline") > 1.0
    assert _intent_boost_factor("어디서 돌아가나요?", "directory_summary") > 1.0
    assert _intent_boost_factor("아키텍처 어떻게 됐어?", "repo_map") >= _intent_boost_factor(
        "아키텍처 어떻게 됐어?", "outline"
    )


def test_intent_boost_implementation_query_prefers_function_and_class():
    assert _intent_boost_factor("이력서 분석 어떻게 동작?", "function") > 1.0
    assert _intent_boost_factor("STT 처리 로직?", "function") > 1.0
    assert _intent_boost_factor("face-analyzer 구현?", "class") > 1.0


def test_intent_boost_neutral_query_returns_one():
    assert _intent_boost_factor("미핏 소개", "function") == 1.0
    assert _intent_boost_factor("팀원 누구야", "outline") == 1.0


def test_intent_boost_handles_empty_inputs():
    assert _intent_boost_factor("", "function") == 1.0
    assert _intent_boost_factor("어떻게 동작?", "") == 1.0
    assert _intent_boost_factor("어떻게 동작?", "generic") == 1.0


def test_low_confidence_detects_common_failure_phrases():
    assert chains_module.is_low_confidence("죄송하지만 구체적인 정보가 없습니다.")
    assert chains_module.is_low_confidence("아직 인덱싱되지 않은 영역이에요.")
    assert chains_module.is_low_confidence("자료가 부족해서 정확히 답하기 어렵습니다.")
    assert chains_module.is_low_confidence("관련 청크를 찾을 수 없습니다.")
    assert chains_module.is_low_confidence("인덱스에 없는 내용입니다.")


def test_low_confidence_negative_on_normal_answer():
    assert not chains_module.is_low_confidence("미핏은 캡스톤 54팀의 면접 준비 플랫폼입니다.")
    assert not chains_module.is_low_confidence("backend/main.py 에서 처리합니다.")
    assert not chains_module.is_low_confidence("")
    assert not chains_module.is_low_confidence("그래프 신호는 PageRank 로 결합됩니다.")


def test_parse_query_variants_json_array():
    out = chains_module._parse_query_variants('["원본", "english code", "한국어 동의어"]', n=3)
    assert out == ["원본", "english code", "한국어 동의어"]


def test_parse_query_variants_fallback_lines():
    raw = """변형:
    1. 회원가입 어떻게?
    2. signup flow user auth
    3. 사용자 가입 절차
    """
    out = chains_module._parse_query_variants(raw, n=3)
    assert len(out) == 3
    assert any("signup" in v for v in out)


def test_parse_query_variants_caps_at_n():
    out = chains_module._parse_query_variants('["a", "b", "c", "d", "e"]', n=3)
    assert out == ["a", "b", "c"]


def test_parse_query_variants_empty_on_garbage():
    assert chains_module._parse_query_variants("", n=3) == []
    assert chains_module._parse_query_variants("nope, no array here", n=3) == []


@pytest.mark.asyncio
async def test_rewrite_query_returns_original_when_no_history():
    chain = _chain_with_llm("이건 호출되지 말아야 함")
    out = await chain.rewrite_query_for_retrieval([], "원본 질문")
    assert out == "원본 질문"
    chain._llm.ainvoke.assert_not_awaited()


@pytest.mark.asyncio
async def test_rewrite_query_uses_history_when_present():
    chain = _chain_with_llm("이력서 분석 모듈 동작 원리")
    history = [
        ChatTurn(role="user", content="이력서 분석은 뭐 해?"),
        ChatTurn(role="assistant", content="이력서를 임베딩해서..."),
    ]
    out = await chain.rewrite_query_for_retrieval(history, "그건 어떻게 동작해?")
    assert out == "이력서 분석 모듈 동작 원리"
    chain._llm.ainvoke.assert_awaited_once()


@pytest.mark.asyncio
async def test_rewrite_query_falls_back_on_exception():
    chain = ChatChain.__new__(ChatChain)
    chain._retriever = None  # type: ignore[attr-defined]
    chain._settings = None  # type: ignore[attr-defined]
    chain._llm = AsyncMock()
    chain._llm.ainvoke = AsyncMock(side_effect=RuntimeError("network down"))
    history = [ChatTurn(role="user", content="이전 질문")]
    out = await chain.rewrite_query_for_retrieval(history, "현재 질문")
    assert out == "현재 질문"


@pytest.mark.asyncio
async def test_rewrite_query_rejects_overlong_response():
    chain = _chain_with_llm("x" * 500)
    out = await chain.rewrite_query_for_retrieval(
        [ChatTurn(role="user", content="이전")],
        "현재",
    )
    assert out == "현재"


@pytest.mark.asyncio
async def test_expand_queries_returns_variants_with_original():
    chain = _chain_with_llm('["회원가입 어떻게?", "signup flow auth", "사용자 가입 절차"]')
    out = await chain.expand_queries("회원가입 어떻게?", n=3)
    assert out[0] == "회원가입 어떻게?"
    assert any("signup" in v for v in out)
    assert len(out) == 3


@pytest.mark.asyncio
async def test_expand_queries_short_circuits_when_no_llm():
    chain = ChatChain.__new__(ChatChain)
    chain._retriever = None  # type: ignore[attr-defined]
    chain._settings = None  # type: ignore[attr-defined]
    chain._llm = None
    assert await chain.expand_queries("질문", n=3) == ["질문"]


@pytest.mark.asyncio
async def test_expand_queries_falls_back_on_parse_failure():
    chain = _chain_with_llm("그냥 자연어 응답, JSON 없음")
    out = await chain.expand_queries("원본", n=3)
    assert out == ["원본"]


@pytest.mark.asyncio
async def test_hypothetical_passages_parses_json_array():
    chain = _chain_with_llm(
        '["미핏 팀은 4명의 멤버로 구성되며 백엔드/분석/프론트/QA 역할을 분담합니다.", '
        '"캡스톤 54팀의 김신건은 팀장으로 시스템 구조를 설계했습니다."]'
    )
    out = await chain.hypothetical_passages("팀원 구성", n=2)
    assert len(out) == 2
    assert all("미핏" in p or "캡스톤" in p or "팀" in p for p in out)


@pytest.mark.asyncio
async def test_hypothetical_passages_empty_when_no_llm():
    chain = ChatChain.__new__(ChatChain)
    chain._retriever = None  # type: ignore[attr-defined]
    chain._settings = None  # type: ignore[attr-defined]
    chain._llm = None
    assert await chain.hypothetical_passages("팀원 구성", n=2) == []


@pytest.mark.asyncio
async def test_hypothetical_passages_empty_when_n_zero():
    chain = _chain_with_llm('["p1", "p2"]')
    assert await chain.hypothetical_passages("질문", n=0) == []
    chain._llm.ainvoke.assert_not_awaited()


@pytest.mark.asyncio
async def test_hypothetical_passages_graceful_on_exception():
    chain = ChatChain.__new__(ChatChain)
    chain._retriever = None  # type: ignore[attr-defined]
    chain._settings = None  # type: ignore[attr-defined]
    chain._llm = AsyncMock()
    chain._llm.ainvoke = AsyncMock(side_effect=RuntimeError("rate limit"))
    assert await chain.hypothetical_passages("팀원 구성", n=2) == []
