FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# 의존성 파일만 먼저 복사 (캐시 활용)
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# 소스 코드 복사
COPY . .

CMD ["celery", "-A", "celery_app", "worker", "-l", "INFO", "-Q", "analysis"]
