from __future__ import annotations

from booth_rag.rag.chains import _SYSTEM_PROMPT_KO


def test_prompt_declares_mefit_scope():
    assert "미핏" in _SYSTEM_PROMPT_KO
    assert "캡스톤 54팀" in _SYSTEM_PROMPT_KO


def test_prompt_explicitly_forbids_off_topic_subjects():
    forbidden_keywords = ["일반 코딩 도움", "정치", "날씨", "jailbreak"]
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
