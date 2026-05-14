# booth-rag

> 미핏 (MeFit) 캡스톤 프로젝트 발표 부스용 RAG + LLM Agent 웹 서비스

국민대학교 캡스톤 **54팀** — 미핏 프로젝트 ([mefit.kr](https://mefit.kr) · [팀 소개](https://kookmin-sw.github.io/2026-capstone-54/)) 의 코드/문서를 인덱싱하여 부스 방문자 질문에 답변하는 ChatGPT-스타일 챗봇입니다.

- **벡터 RAG** (ChromaDB) + **그래프 RAG** (NetworkX) 하이브리드 검색
- **로컬 한국어 임베딩 단일 운영** — HuggingFace 모델 한 종류만 사용 (비용 0). 모델 변경 시 인덱스 재구축
- **코드 구조 인식**: 파일별 outline 청크 (모듈 docstring + 심볼 시그니처) + 디렉토리 요약 청크 자동 생성 → "백엔드 모듈 구성?" 같은 질문에 강함
- **대용량 docx 지원**: Heading 1/2/3 스타일 기반 hierarchical 섹션 청킹 (230+페이지 문서 OK)
- **LangChain** (2026년 5월 기준 최신) 기반 채팅 + **멀티 턴 대화** + SQLite 영속
- **진행 상태 라이브 추적**: CLI 는 tqdm progress bar, 관리자 UI 는 `/api/admin/progress` 폴링
- **인덱싱 대상 제한**: 미핏 모노레포 중 12개 활성 서브 프로젝트만 (backend, frontend, analysis-*, face-analyzer, infra, interview-analysis-report, mefit-diagrams, mefit-tools, scraping, voice-api)
- **관리자 페이지**: MD/DOCX 업로드, 코드베이스 적재, 진행 모니터, 인덱스 초기화
- **비밀값 자동 마스킹** (AWS/OpenAI/Anthropic/JWT/Django/SSH 키 등 11종 정규식 필터)
- **부스 안내 패널**: 54팀 배지, mefit.kr/팀 소개 QR 코드 자동 생성
- **로컬 전용** — `uv run uvicorn` 한 번으로 띄움

## 빠른 시작

```bash
# 1) 의존성 설치
cd booth-rag
uv sync

# 2) 환경 변수 설정
cp .env.example .env
$EDITOR .env  # OPENAI_API_KEY (선택), ADMIN_TOKEN 등 입력

# 3) 임베딩 모델 사전 다운로드 (별도 셸, 한 번만 — 캐시되면 재실행 시 즉시)
bash scripts/download_embeddings.sh
#   ↳ ~/.cache/huggingface/hub/ 에 모델 저장. 다음부터 서버/CLI 부팅 시 즉시 로드됨.
#   ↳ 기본은 .env 의 EMBEDDING_LOCAL_MODEL (기본값 BAAI/bge-m3 ~2.3GB)
#   ↳ 다른 모델 받으려면: bash scripts/download_embeddings.sh --model intfloat/multilingual-e5-small

# 4) 코드베이스 적재
uv run python scripts/ingest_codebase.py

# 5) 서버 실행
uv run uvicorn booth_rag.main:app --host 127.0.0.1 --port 8765
# 또는: bash scripts/run_dev.sh
```

브라우저에서 [http://127.0.0.1:8765](http://127.0.0.1:8765) 접속.

> 💡 3번 단계를 건너뛰어도 서버는 동작합니다 — 다만 첫 부팅 때 모델을 다운로드하느라 ~30초 멈춰 보입니다. 사전 다운로드를 별도 셸로 분리하면 서버는 항상 즉시 뜹니다.

## 임베딩 정책 (로컬 단일)

**임베딩은 항상 로컬 HuggingFace 모델 한 종류만 사용합니다.** RAG 의 기본 원칙상 인덱스를 만든 모델과 검색하는 모델은 같아야 하므로, 본 프로젝트는 의도적으로 임베딩 provider 선택지를 제거했습니다 (OpenAI 임베딩 / 해시 fallback 모두 제거).

### 권장 모델 (한국어 + 코드 친화)

| 모델 | 크기 | 차원 | 비고 |
|---|---|---|---|
| `BAAI/bge-m3` (기본) | ~2.3 GB | 1024 | 다국어 1티어, 부스 권장 |
| `intfloat/multilingual-e5-large` | ~2.2 GB | 1024 | 강력한 대안 |
| `intfloat/multilingual-e5-small` | ~470 MB | 384 | 가벼움 · 빠름 |
| `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | ~470 MB | 384 | 가장 가벼움 |

`.env` 에서 `EMBEDDING_LOCAL_MODEL` 로 변경. 기본 `BAAI/bge-m3`.
Apple Silicon 에서는 **MPS 디바이스 자동 감지** (`EMBEDDING_DEVICE=auto`).

### 모델 변경 절차 (필수)

⚠️ 임베딩 모델을 바꾸면 **반드시 인덱스를 초기화** 후 다시 적재해야 합니다 (벡터 공간이 다르므로 호환 불가):

```bash
# 1) 인덱스 초기화 (벡터 + 그래프)
uv run python scripts/reset_index.py

# 2) .env 에서 EMBEDDING_LOCAL_MODEL 변경
$EDITOR .env

# 3) 새 모델 사전 다운로드 (별도 셸, 권장)
bash scripts/download_embeddings.sh

# 4) 새 모델로 재적재
uv run python scripts/ingest_codebase.py
```

대화 히스토리 (`data/chat.db`) 는 reset 영향을 받지 않습니다.

### 사전 다운로드 CLI 옵션

```bash
# .env 의 EMBEDDING_LOCAL_MODEL 사용 (기본)
bash scripts/download_embeddings.sh

# 다른 모델 받기
bash scripts/download_embeddings.sh --model intfloat/multilingual-e5-small

# 강제 재다운로드 (캐시 무시)
bash scripts/download_embeddings.sh --force-redownload

# verbose 로그
bash scripts/download_embeddings.sh -v
```

캐시 위치: `~/.cache/huggingface/hub/`. 다른 프로젝트나 sentence-transformers 작업과 자동 공유됩니다.

### 2-Phase 동작 방식

1. **`huggingface_hub.snapshot_download`** 로 필요한 파일만 명시 (`allow_patterns`) 받습니다.
   - 받음: `config*.json`, `tokenizer*`, `*.bin`, `*.safetensors`, `1_Pooling/*`, `2_Normalize/*`, `sentencepiece.bpe.model` 등
   - 제외: `onnx/*`, `tf_model.h5`, `flax_model.msgpack`, `openvino/*`, `*.jpg`/`*.png`, `colbert_linear.pt`, `sparse_linear.pt` 등 — sentence-transformers 의 dense embedding 에는 불필요
   - 캐시 hit 이면 `local_files_only=True` 빠른 경로로 네트워크 호출 0회
   - 중단되었던 `*.incomplete` 잔재 자동 정리
2. **`HF_HUB_OFFLINE=1` 워밍업 로드** — sentence-transformers 로 한 번 init 해서 캐시가 정말로 자급 가능한지 검증. 누락 시 명확한 에러로 실패.

> 검증된 결과 (BGE-M3, ~2.3GB): 캐시 hit 시 서버 부팅이 `HF_HUB_OFFLINE=1` 강제 환경에서도 **5초** 만에 ready.

### LLM 채팅 (선택)

`OPENAI_API_KEY` 가 비어 있으면 챗봇은 **검색 결과 발췌만 표시하는 fallback 모드** 로 동작합니다 (LLM 호출 0). 임베딩 + 검색은 정상 동작.

## 임베딩 백엔드 — 로컬 vs 원격

성능이 부족한 노트북에서는 임베딩 추론을 **LAN 의 다른 머신** (예: 맥 스튜디오) 으로 분리할 수 있습니다.

| `EMBEDDING_BACKEND` | 동작 | 권장 환경 |
|---|---|---|
| `local` (기본) | 이 머신에서 sentence-transformers 직접 실행 | M-series Mac (충분한 RAM/GPU) |
| `remote` | LAN 의 임베딩 서버 호출 (HTTP) | 노트북 + 별도 워크스테이션 |

### 이중 머신 구성 (맥북 ↔ 맥 스튜디오)

**맥 스튜디오 (192.168.0.6 — 임베딩 서버 머신)**:

```bash
# 1) 코드 복제 + 의존성
git clone <booth-rag repo>            # 또는 rsync 로 동기화
cd booth-rag && uv sync

# 2) .env 설정 (모델만 일치하면 됨)
echo "EMBEDDING_LOCAL_MODEL=BAAI/bge-m3" > .env
echo "EMBEDDING_DEVICE=auto" >> .env

# 3) 임베딩 모델 사전 다운로드
bash scripts/download_embeddings.sh

# 4) 임베딩 서버 띄우기 (0.0.0.0:8080 바인드 → LAN 접근 가능)
bash scripts/run_embedding_server.sh
#   → 부팅 로그: "Embedding service ready: {'model': 'BAAI/bge-m3', 'dimension': 1024, ...}"
```

**맥북 (메인 booth-rag 서버 머신)**:

```bash
# 1) .env 에 원격 백엔드 설정
cat >> .env <<EOF
EMBEDDING_BACKEND=remote
REMOTE_EMBEDDING_URL=http://192.168.0.6:8080
EMBEDDING_LOCAL_MODEL=BAAI/bge-m3   # 맥 스튜디오와 동일 모델 ID 필수
EOF

# 2) (선택) 맥북에서도 같은 모델을 받아두고 싶다면 — 백업 또는 local 백엔드로 즉시 전환 가능하도록
bash scripts/download_embeddings.sh

# 3) 메인 서버 부팅 — /info 핸드셰이크 후 즉시 ready (sentence-transformers 직접 init 없음)
uv run uvicorn booth_rag.main:app --host 127.0.0.1 --port 8765
#   /health 의 embedding_device 가 "remote:mps" 등으로 표시됨
```

### 동작 확인

```bash
curl http://127.0.0.1:8765/health
# {
#   "embedding_model": "BAAI/bge-m3",
#   "embedding_device": "remote:mps",   ← remote 백엔드 사용 중
#   "embedding_dimension": 1024,
#   ...
# }
```

임베딩 서버 측 로그에서 `POST /embed/documents` / `POST /embed/query` 호출이 보이면 정상.

### 임베딩 서버 엔드포인트

| Method | Path | 용도 |
|---|---|---|
| GET | `/` · `/health` · `/info` | 모델/차원/디바이스 메타데이터 |
| POST | `/embed/documents` | `{texts: [str]}` → `{embeddings: [[float]], dimension, elapsed_ms}` |
| POST | `/embed/query` | `{text: str}` → `{embedding: [float], dimension, elapsed_ms}` |

배치 크기는 클라이언트가 결정합니다 (`REMOTE_EMBEDDING_BATCH_SIZE`, 기본 32).

### 일관성 보장 규칙

⚠️ **두 머신의 `EMBEDDING_LOCAL_MODEL` 이 같아야 합니다.** 인덱스는 임베딩 서버의 모델로 만들어지고 검색도 같은 서버를 통하므로 자동 일관성이 보장됩니다. 모델을 바꾸려면:
1. 양쪽 머신의 `.env` 에서 `EMBEDDING_LOCAL_MODEL` 동시 수정
2. 양쪽 머신에서 `bash scripts/download_embeddings.sh`
3. 임베딩 서버 재시작
4. 맥북에서 `uv run python scripts/reset_index.py && uv run python scripts/ingest_codebase.py`

### 에러 모드

임베딩 서버가 꺼져있으면 메인 서버 부팅 시 즉시 실패:

```
RuntimeError: 원격 임베딩 서버 연결 실패: http://192.168.0.6:8080
맥 스튜디오 등 원격 머신에서 `bash scripts/run_embedding_server.sh` 가 실행 중인지,
그리고 EMBEDDING_LOCAL_MODEL 이 양쪽에 같은 값으로 설정되어 있는지 확인하세요.
원인: [Errno 61] Connection refused
```

## 디렉토리 구조

```
booth-rag/
├── booth_rag/
│   ├── api/             # FastAPI 라우터 (chat / sessions / admin / pages)
│   ├── rag/             # 임베딩 / 벡터 / 그래프 / 하이브리드 retriever / chain / service
│   ├── server/          # 별도 임베딩 서버 (맥 스튜디오 등에서 실행)
│   ├── ingestion/       # 코드 워커 / 청커 / 문서 로더 / 그래프 빌더
│   ├── db/              # SQLite 세션·메시지 스토어 (aiosqlite)
│   ├── ui/              # Jinja2 템플릿 + 정적 자산 (CSS/JS/이미지)
│   ├── utils/           # 비밀값 필터 / QR 코드 생성기
│   ├── config.py        # pydantic-settings (.env)
│   └── main.py          # FastAPI 앱 팩토리 + 라이프스팬
├── scripts/
│   ├── ingest_codebase.py    # 미핏 모노레포 → 인덱스 (CLI)
│   ├── ingest_docs.py        # md/docx 일괄 적재 (CLI)
│   ├── reset_index.py        # 인덱스 초기화 (모델 변경 시)
│   ├── generate_qr.py        # 부스 QR 재생성
│   ├── download_embeddings.* # 임베딩 모델 사전 다운로드
│   ├── run_embedding_server.sh  # 임베딩 서버 런처 (맥 스튜디오 용)
│   └── run_dev.sh
├── data/                # 영속 데이터 (Chroma / 그래프 / SQLite / 업로드) — .gitignore
├── tests/
└── pyproject.toml
```

## 핵심 동작 흐름

```
사용자 질문
   │
   ├─ HybridRetriever.retrieve(query)
   │     ├─ ChromaDB 벡터 유사도 top-k
   │     │     · outline 청크 (파일 시그니처)
   │     │     · directory_summary 청크 (README + 심볼)
   │     │     · 본문 청크 (function/class/markdown_section/docx_section)
   │     ├─ NetworkX 그래프 1-hop 파일 확장
   │     ├─ defines 엣지로 심볼 이웃 추출
   │     ├─ Personalised PageRank (벡터 seed → 그래프 점수 boost)
   │     └─ Global PageRank Top-K 허브 파일 (구조 질문 보강)
   │
   ├─ LangChain ChatOpenAI (한국어 시스템 프롬프트 + scope 가드)
   │     · history (최근 8턴) + 그래프-증강 컨텍스트 + 질문
   │     · 미핏 외 주제는 정중 거절 + 미핏 후속 질문 제안
   │
   ├─ SSE 스트리밍 응답
   │     event: token  → 답변 텍스트 청크
   │     event: done   → 근거 sources [{rel_path, line_start, line_end, kind, text}]
   │     event: followups → 후속 질문 3개 (별도 짧은 LLM 호출)
   │
   └─ SQLite 저장 (sessions / messages / citations JSON에 sources + followups 포함)
```

## 채팅 UI 인터랙션

- **창 내부 스크롤** — `body` 전체가 늘어나지 않고 `.messages` 영역만 스크롤. `body.page-chat` 클래스에만 viewport 락이 적용되어 admin / 다른 페이지는 자연 페이지 스크롤.
- **답변 복사** — 각 assistant bubble 우측 하단의 `📋 복사` 버튼. `navigator.clipboard.writeText` 로 답변 텍스트 복사. 성공 시 1.5초간 `복사됨` 표시.
- **근거 확인하기** — bubble 우측 하단의 `🔍 근거 N` pill. 클릭 시 모달이 열리고 검색에 사용된 청크별 카드 (파일 경로 / 라인 범위 / kind / 본문 발췌, 최대 6개) 가 표시됨. ESC 또는 backdrop 클릭으로 닫힘. 두 버튼은 absolute 배치라 답변 텍스트와 겹치지 않음.
- **응답 메타** — bubble 외부 아래 작은 텍스트로 `⚡ 9.5s 응답 · 검색 3153ms · 쿼리 3개`. 멀티 쿼리 RRF 가 동작 중일 때 쿼리 개수 표시.
- **이어서 물어보기 3개** — 답변 완료 직후 별도 LLM 호출 (`generate_followups`) 로 미핏-범위 후속 질문 3개를 받아 bubble 아래 점선 카드 안에 버튼으로 노출. 클릭하면 즉시 다음 질문으로 submit. 세션 다시 로드해도 SQLite 의 `citations` JSON 에 함께 영속화되어 복원됨.
- **사이드바 세션 검색** — 좌측 사이드바 상단 `🔎 대화 검색...` 입력란. 제목 substring 매칭으로 클라이언트 측 즉시 필터링.

## RAG 강화 — 멀티턴 / 멀티 쿼리 / 다양성

부스 운영 중 자주 발생하는 세 가지 검색 실패를 막기 위한 3중 강화 — 모두 `.env` 스위치로 켜고 끌 수 있습니다.

| 강화 | 효과 | 동작 |
|---|---|---|
| **`RAG_REWRITE_QUERY`** | "그건 어떻게 동작해?" 같은 follow-up 이 standalone 으로 임베딩되어 미스되던 문제 해결 | 짧은 LLM 호출로 최근 4턴 히스토리를 반영한 검색 쿼리 생성. 첫 턴 / 에러 시 원본 그대로 사용. |
| **`RAG_EXPAND_QUERIES`** | "회원가입 어떻게?" 같은 한국어 → 영어 코드 매칭 약한 문제 해결 | LLM 으로 3개 변형 생성 (원본 한국어 / 영어·CamelCase·snake_case / 한국어 동의어). 각 변형으로 검색 후 RRF 융합. |
| **`RAG_USE_MMR`** | 비슷한 청크가 top-k 를 잠식하던 다양성 부족 | ChromaDB `max_marginal_relevance_search` (lambda=0.7, fetch_k=20). 사용 불가 시 plain similarity 로 fallback. |

**Reciprocal Rank Fusion**: 변형별 결과를 `score = Σ 1/(RRF_K + rank)` 로 합산. dedup key 는 `(rel_path, line_start, line_end, symbol)`. `RAG_RRF_K=60` 기본 (Cormack et al. 2009).

검증된 효과 (실제 부스 데이터 2397 청크, "이력서 분석 모듈은 어떻게 작동하나요?"):
- 멀티 쿼리 3개 융합 → `검색 3153ms · 쿼리 3개`
- 응답 latency 메타가 UI 에 표시되어 운영자 즉시 확인 가능

## Graph RAG 강화 (PageRank)

기존 1-hop 이웃 표시 위에 두 가지 PageRank 신호를 결합합니다 (NetworkX 만 사용, 추가 의존성 없음):

| 신호 | 용도 | 설정 |
|---|---|---|
| **Personalised PageRank** | 벡터 검색 결과 (seed 파일들) 를 출발점으로 PPR 계산 → 그래프적 중요도를 retrieval score 에 결합 | `GRAPH_PPR_WEIGHT` (기본 0.15) |
| **Global PageRank Top-K** | 모노레포 전체에서 가장 "중심" 파일 K개 → 구조/아키텍처 질문 시 LLM 컨텍스트에 노출 | `GRAPH_HUB_TOP_K` (기본 5) |
| **Symbol 이웃** | 검색 결과 파일에서 `defines` 엣지로 연결된 심볼 노드 표시 | 항상 활성 |

비활성화: `GRAPH_USE_PAGERANK=false`. PageRank 캐시는 그래프 변경 (merge_files / reset) 시 자동 무효화됩니다.

## 적재 병렬 처리

`EMBEDDING_CONCURRENCY` (기본 4) 로 파일 단위 동시 임베딩 워커 수를 조절합니다:

- `1` — 직렬 (이전 동작)
- `4~8` — 로컬 sentence-transformers 권장 (CPU/MPS 활용)
- `16+` — 원격 임베딩 서버 (LAN) 권장

내부 구현: `asyncio.Semaphore(N)` + `asyncio.to_thread(vector.add_chunks)`. 각 청크의 doc_id 는 `code::{rel_path}::{chunk_index}` 로 unique 하며 ChromaDB 는 collision 시 upsert 하므로 **재시도/중복 적재 자동 idempotent**.

## 코드 구조 RAG (Aider 영감)

기존 청크 위에 두 종류의 "구조 청크" 가 자동 인덱싱됩니다:

1. **Outline 청크** — 각 파일당 1개. 모듈 docstring + import 목록 + 함수/클래스 시그니처 (한 줄 요약 포함)를 압축한 형태. → "X 모듈에 어떤 함수들 있어?" 류 질문 강함.
2. **Directory summary 청크** — 12개 활성 디렉토리당 1개씩. README 발췌 + 대표 파일 목록 + 대표 심볼. → "백엔드는 어떻게 구성돼?" 류 질문 강함.
3. **Repo map 청크** — 디렉토리 트리 한 장. → "이 프로젝트 구조 전체 보여줘" 류 질문 강함.

모두 같은 ChromaDB 컬렉션에 `source_kind="structure"` / `kind="outline"` 등 메타데이터로 구분됩니다.

## 대용량 docx 처리

- python-docx 의 `paragraph.style.name` 으로 `Heading 1/2/3/...` 인식
- Heading 만나면 섹션 종료 → `heading_path` (예: "1. 개요 > 1.2 시스템 구성") 메타데이터 보존
- 섹션 본문이 1800자를 넘으면 추가 size-split (overlap 없이 paragraph 경계 우선)
- 청크 본문 첫 줄에 heading path 가 markdown `#` 으로 prepend
- 230+페이지 보고서도 메모리 안정적으로 처리

## 주요 엔드포인트

| Method | Path | 설명 |
|---|---|---|
| GET | `/` | 메인 채팅 화면 |
| GET | `/admin` | 관리자 콘솔 (`ADMIN_TOKEN` 필요) |
| GET | `/health` | 헬스체크 + 인덱스 통계 + 마지막 진행 상태 |
| POST | `/api/chat` | SSE 스트리밍 채팅 |
| GET/POST/DELETE/PATCH | `/api/sessions[/{id}]` | 세션 CRUD |
| GET | `/api/admin/status` | 인덱스 통계 (관리자) |
| GET | `/api/admin/progress` | 적재 진행 상태 (라이브 폴링 용, 관리자) |
| POST | `/api/admin/upload` | 문서 업로드 (md/docx/txt) |
| POST | `/api/admin/ingest-codebase?max_files=N&dirs=A,B,C` | 모노레포 적재 (백그라운드, 동시 1건만 허용) |
| POST | `/api/admin/reset` | 모든 인덱스 초기화 |

## 진행 상태 추적

**CLI** — tqdm progress bar + INFO 로그:

```
📦 적재 시작
   ├─ 소스: /Users/koa/006-capstone-modules
   ├─ 대상 디렉토리 (12): backend, frontend, ...
   ├─ 임베딩: local
   └─ 최대 파일 수: 제한 없음
files: 14%|██▍       | 87/620 [00:12<00:42, 12.5file/s, backend/webapp/...]
   • graph: 그래프 빌드 중
   • structure: 디렉토리 요약 청크 생성
✅ 완료 (51.4s)
   ├─ 파일: 620
   ├─ 청크 총합: 3041
   ├─ outline 청크: 412
   ├─ directory_summary: 13
   └─ 그래프 노드 추가: 720
```

CLI 출력에 임베딩 모델 정보가 함께 표시됩니다 — 예: `임베딩: BAAI/bge-m3 (mps, 1024-d)`.

**관리자 UI** — 적재 시작 후 자동 폴링 (1.5초 간격). "진행 상태 모니터" 버튼으로 토글 가능:

```
phase=files  (87/620  14.0%)
message=backend/webapp/...
🔄 진행 중...
```

## 보안 / 비밀값

- `.env` 는 `.gitignore` 처리. **절대 커밋 금지**.
- `.env.example` 만 커밋 (값 비어있음).
- 코드/문서 적재 시 [`secret_filter`](booth_rag/utils/secret_filter.py) 가 다음 패턴을 자동 마스킹:
  - AWS Access/Secret Key, OpenAI/Anthropic/Google API Key
  - GitHub/Slack 토큰, JWT, Django insecure key
  - SSH/PEM 개인키 헤더
  - `password = "..."` 류의 일반 할당 패턴
- `.env*`, `id_rsa`, `*.pem`, `credentials.json` 등은 파일 단위로 인덱싱 제외.

## 적재 (Ingestion) 옵션

| 방법 | 라이브 반영 | 권장 시점 |
|---|---|---|
| **CLI** (`scripts/ingest_codebase.py`) | 서버 재시작 필요 | 부스 오픈 전 일괄 |
| **관리자 API** (`/api/admin/ingest-codebase`) | 즉시 반영 (싱글톤 RagService) | 부스 운영 중 추가 |
| **관리자 UI** (`/admin`) | 즉시 반영 | 발표 직전 새 문서 추가 |

## 부스 운영 팁

1. **발표 전 한 번** (인터넷 좋은 환경에서):
   - `bash scripts/download_embeddings.sh` — 임베딩 모델 캐시
   - `uv run python scripts/ingest_codebase.py` — 풀 코드베이스 적재
   - 이후 서버는 인터넷이 없어도 (OpenAI 채팅만 빼고) 정상 동작
2. 사이드바 QR 코드는 첫 부팅 시 자동 생성됩니다 (`scripts/generate_qr.py` 로 재생성 가능).
3. 메인 화면 우측 사이드바에 mefit.kr / 팀 페이지 QR 이 노출됩니다.
4. OpenAI 키 없이 운영할 경우: 검색 결과 + 청크 발췌 표시 모드로 동작 (시연용으로 충분).

## 개발자 가이드

### 환경 셋업

```bash
uv sync                      # 의존성 (dev 그룹 포함)
uv run pre-commit install    # git hook 설치
```

### Lint / Format

`ruff` 단일 도구로 통합 (포맷터 + 린터 + import 정렬). backend/ 의 yapf+flake8+isort 조합을 현대화한 형태이며, **4-space indent + 120-char + double quotes** 컨벤션을 따릅니다.

```bash
uv run ruff format booth_rag/ scripts/ tests/   # 자동 포맷
uv run ruff check --fix booth_rag/ scripts/ tests/  # 자동 수정 가능한 lint 처리
```

활성화된 ruff rule set: `E/W/F/I/N/B/UP/C4/SIM/RUF/PERF/PIE/PT`. 한국어 docstring/주석/이모지에 대해서는 `RUF001/002/003` 을 ignore 합니다.

### Pre-commit

`.pre-commit-config.yaml` 에 정의된 훅 일괄 실행:

```bash
uv run pre-commit run --all-files
```

자동으로 다음을 검사/수정합니다:

- `ruff-check` (lint + autofix)
- `ruff-format` (포맷)
- `trailing-whitespace`, `end-of-file-fixer`, `mixed-line-ending` (라인/EOF 정리)
- `check-yaml`, `check-toml`, `check-json`, `pretty-format-json` (설정 파일 유효성 + 정렬)
- `check-added-large-files` (≤500KB), `check-merge-conflict`, `check-case-conflict`
- `debug-statements`, `detect-private-key` (보안/디버그 흔적 차단)
- `check-github-workflows` (.github/workflows/ 가 있을 때만)

git commit 시 자동으로 동일한 훅이 실행됩니다 (`pre-commit install` 효과).

### 테스트

```bash
uv run pytest -q                       # 전체 (~12s, 51 케이스)
uv run pytest tests/test_secret_filter.py -v   # 단일 모듈
uv run pytest -k smoke                 # 시스템 smoke 만
```

테스트는 다음 레이어로 구성:

| 파일 | 케이스 | 의도 |
|---|---|---|
| `test_secret_filter.py` | 6 | 비밀값 패턴 11종 마스킹 + 파일명 차단 |
| `test_code_walker.py` | 4 | 디렉토리 필터 + 무시 패턴 + secret 파일 차단 |
| `test_code_chunker_outline.py` | 3 | Python AST / TS outline 청크 자동 생성 |
| `test_structure_indexer.py` | 2 | 디렉토리 요약 + repo map 청크 |
| `test_doc_loader_docx.py` | 3 | DOCX heading 1/2/3 hierarchical 청킹 |
| `test_remote_embeddings.py` | 6 | httpx mock transport — 핸드셰이크 / 배칭 / 에러 |
| `test_system_smoke.py` | 11 | FastAPI TestClient — health / sessions / chat SSE / admin guard / 임베딩 서버 contract |
| `test_graph_pagerank.py` | 7 | NetworkX 위 PageRank / PPR / hub_files / symbol_neighbors / 캐시 무효화 |
| `test_parallel_ingest.py` | 4 | asyncio.Semaphore 워커 풀 — exactly-once + idempotent 재실행 |
| `test_prompt_scope.py` | 5 | 시스템 프롬프트 미핏 scope 선언 + off-topic 거절 + 정중 fallback |
| `test_followups.py` | 8 | 후속 질문 LLM 호출 + JSON / 폴백 파싱 + 중복 제거 + 에러 graceful 처리 |

## 기술 스택

- Python 3.12, [uv](https://docs.astral.sh/uv/) 패키지 매니저
- FastAPI · uvicorn · sse-starlette
- LangChain 0.3+ · langchain-chroma · langchain-openai (채팅 only) · **langchain-huggingface (임베딩)**
- ChromaDB (벡터, 단일 collection `booth_rag_chunks`) · NetworkX (그래프) · aiosqlite (대화 영속)
- **sentence-transformers · transformers · torch (MPS 자동)** — 로컬 임베딩
- Jinja2 (서버 템플릿) · 순수 ES Modules (빌드 스텝 없음)
- python-docx · qrcode · pillow · tqdm

## 라이선스

미핏 캡스톤 54팀 내부용. © 2026 Kookmin University Capstone.
