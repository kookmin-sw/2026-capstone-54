# ──────────────────────────────────────────────
# 빌드 스테이지: Python 의존성 설치
#
# builder와 final 모두 동일한 Lambda 베이스 이미지를 사용합니다.
# OS(Amazon Linux 2023)가 같아야 venv 바이너리가 호환됩니다.
# ──────────────────────────────────────────────
FROM public.ecr.aws/lambda/python:3.12 AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/app/.venv

# uv 설치
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# 의존성 파일만 먼저 복사해서 캐시 활용
COPY pyproject.toml uv.lock /_lock/
RUN --mount=type=cache,target=/root/.cache \
    cd /_lock/ && \
    uv sync --frozen --no-install-project


# ──────────────────────────────────────────────
# 최종 이미지: Lambda 런타임
# ──────────────────────────────────────────────
FROM public.ecr.aws/lambda/python:3.12 AS final

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers \
    PATH="/app/.venv/bin:${PATH}"

# Playwright Chromium 런타임 시스템 의존성
RUN dnf install -y \
    alsa-lib \
    atk \
    cups-libs \
    gtk3 \
    libdrm \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXi \
    libXrandr \
    libXScrnSaver \
    libXtst \
    mesa-libgbm \
    nss \
    pango \
    liberation-fonts \
    && dnf clean all

# builder 스테이지에서 venv만 복사
COPY --from=builder /app/.venv /app/.venv

# Playwright Chromium 브라우저 바이너리 설치 (이미지에 포함시켜 콜드스타트 방지)
RUN /app/.venv/bin/playwright install chromium

# 소스 코드를 Lambda 작업 디렉토리에 복사
COPY . ${LAMBDA_TASK_ROOT}/

# Lambda 핸들러 지정: lambda_handler.py 의 handler 함수
CMD ["lambda_handler.handler"]
