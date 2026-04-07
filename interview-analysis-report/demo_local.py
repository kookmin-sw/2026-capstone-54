"""
로컬 데모 스크립트: DB/Celery 없이 LLM 분석 리포트 생성 결과를 확인한다.

사용법:
    # OPENAI_API_KEY 환경 변수 설정 후 실행
    cd interview-analysis-report
    set OPENAI_API_KEY=sk-...
    python demo_local.py
"""

from __future__ import annotations

import json
import sys
import os

# interview-analysis-report 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.llm_analyzer import AnalysisContext, ExchangeData, LLMAnalyzer


def build_sample_context() -> AnalysisContext:
    """샘플 면접 데이터를 생성한다."""
    exchanges = [
        ExchangeData(
            exchange_id=1,
            question="자기소개를 해주세요. 특히 백엔드 개발 경험을 중심으로 말씀해주세요.",
            answer="안녕하세요, 저는 3년차 백엔드 개발자입니다. 주로 Python과 Django를 사용하여 REST API를 개발해왔습니다. 최근에는 대규모 트래픽 처리를 위해 Celery와 Redis를 활용한 비동기 처리 시스템을 구축한 경험이 있습니다. 또한 PostgreSQL 쿼리 최적화를 통해 API 응답 시간을 평균 40% 개선한 성과가 있습니다.",
            exchange_type="initial",
            question_source="resume",
            question_purpose="",
        ),
        ExchangeData(
            exchange_id=2,
            question="Celery를 활용한 비동기 처리 시스템에서 가장 어려웠던 점은 무엇이었나요?",
            answer="가장 어려웠던 점은 태스크 실패 시 재시도 로직이었습니다. 네트워크 오류나 외부 API 타임아웃 등 다양한 실패 원인이 있었는데, 각 상황에 맞는 재시도 전략을 설계하는 것이 까다로웠습니다. exponential backoff와 max_retries를 조합하여 해결했고, dead letter queue를 도입해서 최종 실패한 태스크도 추적할 수 있게 했습니다.",
            exchange_type="followup",
            question_source="",
            question_purpose="문제 해결 과정과 기술적 깊이를 파악하기 위함",
        ),
        ExchangeData(
            exchange_id=3,
            question="채용공고에 명시된 마이크로서비스 아키텍처 경험에 대해 말씀해주세요.",
            answer="네, 이전 회사에서 모놀리식 서비스를 마이크로서비스로 전환하는 프로젝트에 참여했습니다. 도메인별로 서비스를 분리하고 API Gateway를 도입했습니다. 서비스 간 통신은 REST와 메시지 큐를 혼합하여 사용했습니다.",
            exchange_type="initial",
            question_source="job_posting",
            question_purpose="",
        ),
    ]

    return AnalysisContext(
        session_id=999,
        started_at="2026-04-07T10:00:00",
        duration_seconds=900,
        difficulty_level="medium",
        resume_file="sample_resume.md",
        job_posting_file="sample_job_posting.md",
        total_initial_questions=2,
        total_followup_questions=1,
        avg_answer_length=150,
        exchanges=exchanges,
        resume_content="""# 홍길동 - 백엔드 개발자
## 경력
- ABC 회사 (2023~현재): Python/Django 백엔드 개발
  - REST API 설계 및 구현
  - Celery 기반 비동기 처리 시스템 구축
  - PostgreSQL 쿼리 최적화 (응답 시간 40% 개선)
- DEF 회사 (2021~2023): 주니어 개발자
  - 모놀리식 → 마이크로서비스 전환 참여
## 기술 스택
Python, Django, FastAPI, PostgreSQL, Redis, Celery, Docker, AWS
""",
        job_posting_content="""# 백엔드 개발자 채용
## 주요업무
- REST API 설계 및 개발
- 마이크로서비스 아키텍처 설계 및 운영
- 대규모 트래픽 처리 시스템 구축
## 자격요건
- Python 백엔드 개발 경력 3년 이상
- Django 또는 FastAPI 프레임워크 경험
- RDBMS (PostgreSQL) 활용 능력
## 우대사항
- Celery, Redis 등 비동기 처리 경험
- Docker, Kubernetes 운영 경험
- CI/CD 파이프라인 구축 경험
""",
    )


def main() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        print("OPENAI_API_KEY 환경 변수를 설정해주세요.")
        print("  set OPENAI_API_KEY=sk-...")
        sys.exit(1)

    print("=" * 60)
    print("면접 분석 리포트 로컬 데모")
    print("=" * 60)
    print()

    context = build_sample_context()
    print(f"세션 ID: {context.session_id}")
    print(f"질문 수: 초기 {context.total_initial_questions}개 + 꼬리질문 {context.total_followup_questions}개")
    print(f"난이도: {context.difficulty_level}")
    print()
    print("LLM 분석 중... (30초~1분 소요)")
    print()

    analyzer = LLMAnalyzer()
    result = analyzer.analyze(context)

    print("=" * 60)
    print("분석 결과")
    print("=" * 60)
    print()

    # 종합 점수
    print(f"[종합 점수] {result.overall_score}점 / {result.overall_grade}")
    print(f"  {result.overall_comment}")
    print()

    # 카테고리 평가
    print("[카테고리별 평가]")
    for cat in result.category_scores:
        print(f"  - {cat['category']}: {cat['score']}점")
        print(f"    {cat.get('comment', '')}")
    print()

    # 질문별 피드백
    print("[질문별 피드백]")
    for fb in result.question_feedbacks:
        print(f"  Q: {fb.get('question', '')[:50]}...")
        print(f"    잘한 점: {fb.get('strengths', [])}")
        print(f"    개선점: {fb.get('improvements', [])}")
        print(f"    모범답변: {fb.get('model_answer', '')[:80]}...")
        print()

    # 강점/개선점
    print("[강점]")
    for s in result.strengths:
        print(f"  - {s.get('title', '')}: {s.get('evidence', '')}")
    print()
    print("[개선 영역]")
    for i in result.improvement_areas:
        print(f"  - {i.get('title', '')}: {i.get('evidence', '')}")
    print()

    # 토큰 사용량
    print("[토큰 사용량]")
    print(f"  입력: {result.input_tokens}, 출력: {result.output_tokens}, 총: {result.total_tokens}")
    print(f"  비용: ${result.total_cost_usd:.6f}")
    print()

    # 전체 JSON 출력
    print("=" * 60)
    print("전체 JSON 결과")
    print("=" * 60)
    output = {
        "overall_score": result.overall_score,
        "overall_grade": result.overall_grade,
        "overall_comment": result.overall_comment,
        "category_scores": result.category_scores,
        "question_feedbacks": result.question_feedbacks,
        "strengths": result.strengths,
        "improvement_areas": result.improvement_areas,
        "input_tokens": result.input_tokens,
        "output_tokens": result.output_tokens,
        "total_tokens": result.total_tokens,
        "total_cost_usd": result.total_cost_usd,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
