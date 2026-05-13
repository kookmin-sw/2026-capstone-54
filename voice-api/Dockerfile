FROM python:3.14-slim-bookworm AS builder

ARG PORT=8001
ENV PORT=${PORT} \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=automatic \
    UV_PROJECT_ENVIRONMENT=/app/.venv

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml uv.lock /_lock/
RUN --mount=type=cache,target=/root/.cache \
    cd /_lock/ && \
    uv sync --frozen --no-install-project

# ── Final Image ──
FROM python:3.14-slim-bookworm AS final

ARG PORT=8001
ENV PORT=${PORT} \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH"

RUN mkdir -p /app

# Copy venv from builder
COPY --from=builder /app/.venv /app/.venv

WORKDIR /app
COPY ./app /app/app

EXPOSE ${PORT}

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
