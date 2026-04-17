# ========================================
# MeFit Tools GUI - Dockerfile
# ========================================
# Streamlit 대시보드를 위한 Python + Docker CLI 환경
# uv 패키지 매니저 사용

FROM python:3.12-slim

# uv 설치
RUN pip install uv

# Docker CLI 설치 (from official Docker repository)
# https://docs.docker.com/engine/install/debian/
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/* \
    && install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && chmod a+r /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

# Create symlink for docker-compose v2 (docker compose plugin)
# Note: docker compose is the v2 CLI, docker-compose is the standalone
RUN ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true

# 앱 디렉토리 설정
WORKDIR /app

# pyproject.toml 및 uv.lock 복사 및 uv로 의존성 설치
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# 앱 코드 복사
COPY . .

# 실행
CMD ["uv", "run", "streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]