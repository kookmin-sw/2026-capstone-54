from __future__ import annotations

from booth_rag.rag.query_intent import classify_queries, classify_query


def test_clear_code_query_routes_code_only():
    out = classify_query("backend/core.py 의 handle_request() 함수가 어떻게 동작?")
    assert out.is_code_only


def test_clear_doc_query_routes_docs_only():
    out = classify_query("미핏 54팀 팀원 구성과 서비스 소개해줘")
    assert out.is_docs_only


def test_ambiguous_query_routes_both():
    out = classify_query("미핏 어떻게 만들었어")
    assert out.use_code
    assert out.use_docs


def test_empty_query_routes_both():
    out = classify_query("")
    assert out.use_code
    assert out.use_docs


def test_threshold_requires_at_least_2_hits():
    out = classify_query("함수")
    assert out.use_code
    assert out.use_docs


def test_aggregate_requires_all_probes_agree():
    code_only = "backend/core.py::handle() 구현"
    doc_only = "미핏 팀원 발표자료 소개"
    out = classify_queries([code_only, doc_only])
    assert out.use_code
    assert out.use_docs


def test_aggregate_all_code_only_stays_code_only():
    out = classify_queries(
        [
            "backend/core.py::handle() 함수 구현",
            "src/api.ts export class AuthService method",
        ]
    )
    assert out.is_code_only


def test_aggregate_all_docs_only_stays_docs_only():
    out = classify_queries(
        [
            "미핏 54팀 팀원 구성",
            "발표자료에 있는 서비스 소개",
        ]
    )
    assert out.is_docs_only
