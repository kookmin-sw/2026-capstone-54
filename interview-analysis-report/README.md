# 면접 분석 리포트 서비스

면접 세션 완료 후 LLM 기반 종합 분석 리포트를 생성하는 독립 서비스입니다.
backend(Django)와 동일한 PostgreSQL/Redis 인프라를 공유하며, Celery worker로 동작합니다.

## 아키텍처

```
backend (Django)                    interview-analysis-report (Python + Celery)
┌──────────────┐                    ┌──────────────────────┐
│ ReportAPIView │──send_task()──→   │ Celery Worker        │
│   POST /report│    (Redis)        │  └─ ReportGenerator  │
│   GET  /report│                   │      └─ LLMAnalyzer  │
└──────┬───────┘                    └──────────┬───────────┘
       │                                       │
       └───────── PostgreSQL ──────────────────┘
```

- backend: 리포트 생성 요청(POST) → AnalysisReport 생성(generating) → Celery 태스크 발행
- analysis-worker: 태스크 수신 → DB에서 면접 데이터 조회 → LLM 분석 → 결과 DB 저장
- backend: 리포트 조회(GET) → DB에서 결과 반환

## 프로젝트 구조

```
interview-analysis-report/
├── config.py                 # 환경 변수 (DATABASE_URL, REDIS_URL, OPENAI_API_KEY 등)
├── celery_app.py             # Celery 앱 설정 (analysis 큐)
├── Dockerfile                # Docker 이미지 빌드
├── pyproject.toml            # 의존성 관리
├── demo_local.py             # 로컬 데모 스크립트 (DB 없이 LLM 호출 테스트)
│
├── db/
│   ├── connection.py         # SQLAlchemy 엔진/세션 팩토리
│   └── models.py             # 테이블 매핑 (InterviewSession, Exchange, AnalysisReport)
│
├── services/
│   ├── llm_analyzer.py       # LLM 호출, 프롬프트 구성, JSON 파싱, 등급 산출
│   └── report_generator.py   # 리포트 생성 오케스트레이션 (DB 조회 → LLM → 저장)
│
├── tasks/
│   └── generate_report.py    # Celery 태스크 진입점
│
├── utils/
│   ├── token_tracker.py      # LangChain 토큰 추적 콜백 + 비용 계산
│   └── document_loader.py    # 이력서/채용공고 파일 로딩
│
└── tests/                    # 속성 기반 테스트 (Hypothesis)
    ├── test_score_grade_mapping_property.py
    ├── test_category_structure_property.py
    ├── test_feedback_completeness_property.py
    ├── test_strengths_improvements_property.py
    ├── test_report_status_transition_property.py
    ├── test_avg_answer_time_property.py
    └── test_token_tracker_property.py
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://postgres:postgres@localhost:5432/team_four_db` |
| `REDIS_URL` | Redis 브로커 URL | `redis://localhost:6379/0` |
| `OPENAI_API_KEY` | OpenAI API 키 | (필수) |
| `OPENAI_MODEL` | 사용할 모델 | `gpt-4o-mini` |
| `FILE_STORAGE_TYPE` | 파일 저장소 타입 (`local` / `s3`) | `local` |
| `MEDIA_ROOT` | 미디어 파일 경로 | `/app/media` |

## 로컬 데모 실행

DB나 Docker 없이 LLM 분석 결과를 바로 확인할 수 있습니다:

```powershell
cd interview-analysis-report
$env:OPENAI_API_KEY="sk-..."
python demo_local.py
```

샘플 면접 데이터(질문 3개)로 LLM을 호출하여 종합 점수, 카테고리 평가, 질문별 피드백, 강점/개선점을 출력합니다.

## Docker Compose 실행 (전체 스택)

backend의 `docker-compose.yml`에 analysis-worker가 포함되어 있습니다:

```powershell
cd backend
docker-compose up -d --build
docker-compose exec webapp python manage.py migrate
```

### API 사용

```powershell
# 리포트 생성 요청 (완료된 세션 ID 필요)
curl.exe -X POST http://localhost:8000/api/v1/interview/sessions/{session_id}/report/
# → {"reportId": 1, "status": "generating"}

# 리포트 조회 (폴링)
curl.exe http://localhost:8000/api/v1/interview/sessions/{session_id}/report/
# → generating 중이면 상태만, completed면 전체 리포트 데이터 반환

# analysis-worker 로그 확인
docker-compose logs -f analysis-worker
```

## 테스트

```powershell
cd interview-analysis-report
pip install hypothesis
python -m pytest tests/ -v
```

7개 속성 기반 테스트(Hypothesis)로 핵심 로직을 검증합니다:
- 점수 → 등급 매핑 정확성
- 카테고리 평가 구조 불변성 (6개 카테고리)
- 질문별 피드백 완전성
- 강점/개선점 최소 개수 및 근거
- 리포트 상태 전이 (generating → completed/failed)
- 평균 답변 시간 계산
- 토큰 사용량 및 비용 계산

## 리포트 구성

생성되는 리포트는 5개 섹션으로 구성됩니다:

1. **개요/요약**: 면접 일시, 소요 시간, 난이도, 총 문항 수, 평균 답변 시간/길이
2. **종합 점수**: 0~100점 + 등급(Excellent/Good/Average/Below Average/Poor) + 해석 코멘트
3. **카테고리별 평가**: 직무 적합성, 구체성, 전달력, 일관성, 유창성, 답변 길이 적절성
4. **질문별 피드백**: 각 질문에 대한 잘한 점, 개선점, 모범답변
5. **강점 및 개선 영역**: 전체 면접에서 도출된 강점/개선점 + 구체적 근거

## 기술 스택

- Python 3.12
- Celery (Redis 브로커)
- SQLAlchemy (PostgreSQL 접근)
- LangChain + OpenAI (LLM 분석)
- Hypothesis (속성 기반 테스트)
- Docker
