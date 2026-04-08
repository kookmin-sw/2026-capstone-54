# ──────────────────────────────────────────────
# 빌드 스테이지: Python 의존성 설치
# ──────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/app/.venv

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 의존성 파일만 먼저 복사 (캐시 활용)
COPY pyproject.toml uv.lock /_lock/
RUN --mount=type=cache,target=/root/.cache \
    cd /_lock/ && \
    uv sync --frozen --no-install-project


# ──────────────────────────────────────────────
# 최종 이미지: Celery Worker 런타임
# ──────────────────────────────────────────────
FROM python:3.12-slim-bookworm AS final

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:${PATH}"

# builder 스테이지에서 venv 복사
COPY --from=builder /app/.venv /app/.venv

WORKDIR /app
COPY . /app/

# 진입점: Celery Worker
# ANALYSIS_CONCURRENCY 환경변수로 동시 처리 수 제어 (기본값 2)
CMD ["sh", "-c", "celery -A celery_app worker -Q analysis -l INFO -E --concurrency ${ANALYSIS_CONCURRENCY:-2}"]
