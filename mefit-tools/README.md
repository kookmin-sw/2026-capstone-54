# MeFit Tools

MeFit 플랫폼의 로컬 운영/개발을 위한 **통합 오케스트레이션 도구**입니다.  
`Makefile + Docker Compose + Streamlit GUI`를 중심으로, 다중 프로젝트(backend/voice-api/scraping/analysis/report/frontend)를 일관된 방식으로 제어합니다.

---

## 1) 핵심 기능

- 전체 프로젝트 일괄 시작/중지/상태 조회
- 프로젝트별 서비스 단위 Start/Stop
- Streamlit Web GUI(`http://localhost:8501`) 기반 운영 화면
- Docker Engine / Compose 진단 정보 표시
- Logs Workspace
  - Follow 모드
  - 주기 갱신
  - 검색(키워드/Regex, case 옵션)
  - 레벨 하이라이트(INFO/WARN/ERROR...)
  - 다운로드

---

## 2) 디렉토리 구조

```text
mefit-tools/
├── Makefile
├── .gitignore
├── README.md
├── scripts/
│   ├── up-all.sh
│   ├── down-all.sh
│   ├── up.sh
│   ├── down.sh
│   ├── logs.sh
│   └── status.sh
└── gui/
    ├── app.py
    ├── config.py
    ├── Dockerfile
    ├── docker-compose.gui.yml
    ├── pyproject.toml
    ├── uv.lock
    └── mefit_gui/
        ├── __init__.py
        ├── constants.py
        ├── docker_ops.py
        ├── dashboard.py
        └── logs_view.py
```

---

## 3) 빠른 시작

### 3-1. 필수 조건

- Docker Engine 실행 중
- `docker compose` 또는 `docker-compose` 사용 가능
- 루트 경로 기준 프로젝트 디렉토리 존재
  - `backend/`, `voice-api/`, `scraping/`, `analysis-resume/`, `interview-analysis-report/`, `frontend/`

### 3-2. 기본 명령

```bash
cd mefit-tools

# 도움말
make help

# GUI 실행
make gui-up

# 전체 상태
make status

# 특정 프로젝트 시작
make up PROJECT=backend

# 특정 프로젝트 중지
make down PROJECT=voice-api
```

---

## 4) GUI 사용 가이드

### Dashboard 모드
- 프로젝트별 상태 카드
- 서비스 진행률
- Docker Compose 컨테이너 목록(expander)
  - 서비스별 Start / Stop / Logs
  - 프로젝트 단위 Start All / Stop All

### Logs 모드
- Project/Service 선택
- Lines 수 지정
- Follow + Refresh 주기
- 검색 (Regex, Case)
- Highlight log levels
- 로그 다운로드

> 컨테이너 목록의 `Logs` 버튼을 누르면 Logs 모드로 전환되고, 해당 서비스가 자동 선택됩니다.

---

## 5) 주요 Make 타겟

### 전체 관리

```bash
make up-all
make down-all
make restart-all
make clean-all
```

### 개별 프로젝트

```bash
make up PROJECT=backend
make down PROJECT=scraping
make restart PROJECT=analysis-resume
```

### 상태/로그

```bash
make status
make status PROJECT=voice-api
make logs PROJECT=backend SERVICE=webapp
```

### GUI

```bash
make gui-up
make gui-down
make gui-status
make gui-logs
make gui-local
```

---

## 6) 운영 시 권장 사항

### 안전한 curl 사용 (무한 대기 방지)

```bash
curl --fail --show-error --silent \
  --connect-timeout 5 \
  --max-time 20 \
  --retry 2 --retry-delay 1 --retry-max-time 10 \
  -I http://localhost:8501
```

- 타임아웃 없는 curl 호출 금지
- 종료 조건 없는 루프에서 curl 반복 금지

---

## 7) 문제 해결

### GUI에서 컨테이너가 안 보일 때
1. `make gui-down && make gui-up`
2. GUI 사이드바 진단에서 Docker/Compose/context 확인
3. `PROJECT_ROOT`가 실제 워크스페이스 경로인지 확인

### Start/Stop 실패 시
1. 해당 프로젝트 `docker-compose.yml` 유효성 확인
2. `docker compose ps --all` 직접 확인
3. GUI `Logs` 모드에서 서비스 로그 확인

---

## 8) 유지보수 가이드 (코드)

- `app.py`: 엔트리포인트/라우팅만 유지
- `docker_ops.py`: Docker/Compose I/O 전담
- `dashboard.py`: 운영 UI 컴포넌트
- `logs_view.py`: 로그 검색/렌더링/하이라이트

새 기능은 가능한 한 위 모듈 경계를 유지해 추가하세요.

---

## 9) 관련 문서

- `../backend/README.md`
- `../voice-api/README.md`
- `../scraping/README.md`
- `../analysis-resume/README.md`
- `../interview-analysis-report/README.md`
