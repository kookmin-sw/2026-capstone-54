from __future__ import annotations

from booth_rag.rag.chains import _SYSTEM_PROMPT_KO


def test_prompt_declares_mefit_scope():
    assert "미핏" in _SYSTEM_PROMPT_KO
    assert "캡스톤 54팀" in _SYSTEM_PROMPT_KO


def test_prompt_explicitly_forbids_off_topic_subjects():
    forbidden_keywords = ["일반 코딩", "정치", "날씨", "jailbreak"]
    for keyword in forbidden_keywords:
        assert keyword in _SYSTEM_PROMPT_KO, f"prompt should mention {keyword}"


def test_prompt_provides_polite_refusal_template():
    assert "죄송하지만" in _SYSTEM_PROMPT_KO
    assert "미핏" in _SYSTEM_PROMPT_KO
    assert "후속 질문" in _SYSTEM_PROMPT_KO


def test_prompt_keeps_korean_language_rule():
    assert "한국어로" in _SYSTEM_PROMPT_KO


def test_prompt_mentions_pagerank_hub_section():
    assert "허브 파일" in _SYSTEM_PROMPT_KO
    assert "PageRank" in _SYSTEM_PROMPT_KO


def test_prompt_allows_team_member_role_questions():
    for keyword in ["팀 구성", "팀원", "역할", "담당자", "조직도"]:
        assert keyword in _SYSTEM_PROMPT_KO, f"team scope keyword missing: {keyword}"


def test_prompt_separates_no_data_from_refusal():
    assert "아직" in _SYSTEM_PROMPT_KO
    assert "인덱싱" in _SYSTEM_PROMPT_KO
    has_no_refuse = any(token in _SYSTEM_PROMPT_KO for token in ["거절하지", "거절은 아닙니다", "거절 아님"])
    assert has_no_refuse, "prompt should distinguish 'no data' from 'refusal'"


def test_prompt_forbids_circular_followup_suggestions():
    assert "방금 물어본 주제" in _SYSTEM_PROMPT_KO
    assert "다른 주제" in _SYSTEM_PROMPT_KO


def test_prompt_defines_short_query_interpretation_rules():
    assert "단어 해석 규칙" in _SYSTEM_PROMPT_KO
    for keyword in ["팀원", "구성원", "멤버", "조직"]:
        assert keyword in _SYSTEM_PROMPT_KO, f"missing short-query keyword: {keyword}"


def test_prompt_orders_answer_priorities_explicitly():
    assert "답변 우선순위" in _SYSTEM_PROMPT_KO
    assert "거절 아님" in _SYSTEM_PROMPT_KO
