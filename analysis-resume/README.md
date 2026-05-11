# analysis-resume

이력서 분석 전용 Celery Worker 서비스입니다.
Django 백엔드와 분리된 독립 마이크로서비스로, DB에 직접 접근하지 않고 모든 결과를 Celery 태스크 payload로 백엔드에 전달합니다.

---

## 역할

이력서(PDF 파일 또는 텍스트)를 받아 **LLM 분석 + 벡터 임베딩**을 수행하고, 결과를 백엔드로 전송합니다.

---

## 처리 파이프라인

```
[file 타입]
  1. extract_text     → S3에서 PDF 다운로드 후 텍스트 추출
  2. embed_resume  ─┐
                    ├─ 병렬 실행 (Celery chord)
  3. analyze_resume ┘
  4. finalize_resume  → 결과 합산 후 백엔드로 전송

[text 타입]
  extract_text 단계 생략, 바로 2번부터 시작
```

### 각 태스크

| 태스크 | 설명 |
|--------|------|
| `extract_text` | S3에서 PDF를 읽어 텍스트 추출 |
| `embed_resume` | 텍스트 청킹 → OpenAI 임베딩 벡터 생성 |
| `analyze_resume` | GPT-4o-mini로 이력서 구조화 분석 (최대 4개 청크 병렬 처리) |
| `finalize_resume` | 원문 임베딩 + 섹션별 구조화 임베딩 추가 생성 → 백엔드 전송 |
| `reembed_resume` | 사용자가 이력서를 직접 수정한 경우, LLM 재분석 없이 임베딩만 재생성 |

---

## LLM 분석 결과

GPT가 이력서를 읽고 아래 항목을 구조화된 JSON으로 추출합니다.

- 기본 정보 (이름, 이메일, 연락처, 거주지)
- 경력 요약, 스킬 (기술/소프트/도구/외국어)
- 경력 사항, 학력, 자격증, 수상, 프로젝트
- 총 경력 연차, 산업 도메인, 키워드, 직군 카테고리

---

## 기술 스택

- **Celery** — 비동기 태스크 (chord / chain / group 패턴)
- **Redis** — 브로커 + 결과 백엔드
- **OpenAI** — GPT-4o-mini (분석), text-embedding-3-small (임베딩)
- **LangChain** — structured output, text splitter, embeddings
- **boto3 / S3** — PDF 파일 저장소
- **pypdf** — PDF 텍스트 추출

---

## 환경 설정

`.env.example`을 복사해 `.env`를 만들고 아래 값을 채워주세요.

```env
# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_LLM_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# S3 (개발 시 S3Mock 사용)
AWS_STORAGE_BUCKET_NAME=mefit-files
AWS_S3_REGION_NAME=us-east-1
AWS_S3_ENDPOINT_URL=http://localhost:9090   # 운영 환경에서는 제거
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## 실행

```bash
# 의존성 설치
uv sync

# Worker 실행
celery -A app.celery_app worker -Q analysis-resume -l INFO --concurrency 2
```

Docker를 사용하는 경우:

```bash
docker compose up
```

---

## 프로젝트 구조

```
app/
├── tasks/
│   ├── process_resume.py    # 파이프라인 진입점 및 오케스트레이션
│   ├── extract_text.py      # PDF 텍스트 추출
│   ├── embed_resume.py      # 임베딩 생성
│   ├── analyze_resume.py    # LLM 분석
│   ├── finalize_resume.py   # 결과 합산 및 백엔드 전송
│   └── reembed_resume.py    # 임베딩 재생성
├── common/
│   ├── chunker.py           # 텍스트 청킹 (RecursiveCharacterTextSplitter)
│   ├── embedder.py          # OpenAI 임베딩 클라이언트
│   └── llm.py               # LLM 호출 및 structured output
├── schemas/
│   └── parsed_data.py       # 분석 결과 Pydantic 스키마
├── celery_app.py            # Celery 앱 설정
└── config.py                # 환경 변수 관리
```
