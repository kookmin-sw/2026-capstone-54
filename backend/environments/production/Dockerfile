FROM python:3.12-slim-bookworm AS builder

ARG PORT=8000
ENV PORT=${PORT} \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/app/.venv

# 빌드 의존성 (최종 이미지에는 포함되지 않음)
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml uv.lock /_lock/
RUN --mount=type=cache,target=/root/.cache \
    cd /_lock/ && \
    uv sync --frozen --no-install-project

# ── 최종 이미지 ──
FROM python:3.12-slim-bookworm AS final

ARG PORT=8000
ENV PORT=${PORT} \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

# 런타임 최소 의존성만 포함
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    netcat-traditional \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app

# builder에서 venv만 복사
COPY --from=builder /app/.venv /app/.venv

WORKDIR /app/webapp
COPY ./webapp /app/webapp

COPY ./environments/production/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE ${PORT}
