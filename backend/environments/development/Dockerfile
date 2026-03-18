FROM python:3.12-slim-trixie as python-base

ARG PORT=8000
ENV PORT=${PORT} \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/app/.venv

FROM python-base AS base

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    netcat-traditional \
    build-essential \
    curl \
    wget \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Git configuration
RUN git config --global url."https://".insteadOf git:// && \
    git config --global url."https://".insteadOf ssh://git@

RUN mkdir -p /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

FROM base AS builder

COPY pyproject.toml uv.lock /_lock/

RUN --mount=type=cache,target=/root/.cache \
  cd /_lock/ && \
  uv sync --frozen --no-install-project

WORKDIR /app/webapp

COPY ./webapp /app/webapp

ENV PATH="/app/.venv/bin:$PATH"

COPY ./environments/development/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT [ "/app/entrypoint.sh" ]

EXPOSE ${PORT}
