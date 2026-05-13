# MeFit Tools GUI

Streamlit 기반 MeFit 플랫폼 관리 대시보드

## 기능

- **프로젝트 관리**: 프로젝트별 On/Off 토글 버튼
- **상태 모니터링**: 서비스 상태 시각화 (🟢 RUNNING, ⚪ STOPPED, 🔴 ERROR)
- **리소스 모니터링**: CPU/Memory 사용량 (docker stats 활용)
- **로그 뷰어**: 실시간 로그 미리보기 패널
- **바로가기**: 주요 서비스 URL 빠른 접근

## 사용 방법

### 방법 1: 로컬 Python 환경에서 실행

```bash
cd mefit-tools/gui

# 의존성 설치
pip install -r requirements.txt

# 실행
streamlit run app.py
```

브라우저에서 `http://localhost:8501` 접속

### 방법 2: Docker로 실행

```bash
cd mefit-tools

# 네트워크 생성 (없을 경우)
docker network create mefit-local

# GUI 실행
docker-compose -f gui/docker-compose.gui.yml up
```

브라우저에서 `http://localhost:8501` 접속

## UI 구조

```
┌─────────────────────────────────────────────────────────────┐
│  🚀 MeFit Tools Dashboard                    [2024-01-15]  │
├─────────────┬───────────────────────────────────────────────┤
│ ⚙️ Settings │                                               │
│             │  🔗 Quick Access                              │
│ 📁 Project  │  [Backend API] [Flower] [S3 Mock] [Voice API] │
│  ○ All      │                                               │
│  ● backend  │  ┌──────────┬─────────┬──────────┐          │
│  ○ voice    │  │ Projects │ Running │ Stopped  │          │
│  ○ scraping │  │    5     │    2    │    3     │          │
│             │  └──────────┴─────────┴──────────┘          │
│ 🔄 Refresh  │                                               │
│             │  🟢 Backend                    [Start] [Stop]│
│ 🔗 Links    │  ████████████░░░░░░░░░ 3/7 services          │
│  - Backend  │                                               │
│  - Flower   │  ⚪ Voice API                  [Start] [Stop]  │
│  - S3 Mock  │  ░░░░░░░░░░░░░░░░░░░░░░ 0/1 services          │
│  - Voice    │                                               │
│             │  📊 Resource Usage                            │
│ ℹ️ Help      │  ┌─────────────────────────────────┐          │
│             │  │ Container │ CPU │ Memory │ ...  │          │
│             │  ├───────────┼─────┼────────┼──────┤          │
│             │  │ webapp    │ 2%  │ 256MB  │ ...  │          │
│             │  └─────────────────────────────────┘          │
└─────────────┴───────────────────────────────────────────────┘
```

## 단일 프로젝트 뷰

```
┌─────────────────────────────────────────────────────────────┐
│  📁 Backend                              [Restart All]     │
├─────────────────────────────────────────────────────────────┤
│  📋 Services                                                 │
│  ┌────────────┬──────┬────────┬──────────┐                │
│  │ Web App    │ 🟢   │ Port   │ → URL    │                │
│  │ (webapp)   │RUNNING│ 8000  │          │                │
│  ├────────────┼──────┼────────┼──────────┤                │
│  │ PostgreSQL │ 🟢   │        │          │                │
│  │ (postgres) │RUNNING│       │          │                │
│  ├────────────┼──────┼────────┼──────────┤                │
│  │ Redis      │ 🟢   │        │          │                │
│  │ (redis)    │RUNNING│       │          │                │
│  └────────────┴──────┴────────┴──────────┘                │
│                                                             │
│  📜 Logs                                             [Logs] │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Tab: Web App] [Tab: PostgreSQL] [Tab: Redis] ...   │   │
│  │                                                     │   │
│  │ 2024-01-15 10:30:00 - Starting server...            │   │
│  │ 2024-01-15 10:30:01 - Server running on :8000       │   │
│  │ 2024-01-15 10:30:05 - Connected to PostgreSQL      │   │
│  │ ...                                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 프로젝트 목록

| 프로젝트 | 설명 | 서비스 수 |
|---------|------|----------|
| Backend | Django Backend | 7 |
| Voice API | FastAPI Voice Service | 1 |
| Scraping | Web Scraping Worker | 1 |
| Resume Analysis | Resume Analysis Worker | 1 |
| Interview Analysis | Interview Analysis Worker | 1 |

## 바로가기 URL

| 서비스 | URL |
|--------|-----|
| Backend API | http://localhost:8000 |
| Flower (Celery) | http://localhost:5555/admin/flower |
| S3 Mock | http://localhost:9090 |
| Voice API | http://localhost:8001 |

## 요구사항

- Python 3.10+
- Docker & Docker Compose
- Streamlit 1.28+

## 라이선스

MIT License
