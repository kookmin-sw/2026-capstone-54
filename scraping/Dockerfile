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
    PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers \
    PATH="/app/.venv/bin:${PATH}"

# Playwright Chromium 런타임 시스템 의존성 (bookworm 기준)
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libx11-6 \
    libxext6 \
    libxcb1 \
    fonts-liberation \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# builder 스테이지에서 venv 복사
COPY --from=builder /app/.venv /app/.venv

# Playwright Chromium 브라우저 바이너리 설치
RUN playwright install chromium

WORKDIR /app
COPY . /app/

# Celery Worker 실행
# SCRAPER_CONCURRENCY 환경변수로 동시 처리 수 제어 (기본값 2)
CMD ["sh", "-c", "celery -A celery_app worker -Q scraping -l INFO -E --concurrency ${SCRAPER_CONCURRENCY:-2}"]
