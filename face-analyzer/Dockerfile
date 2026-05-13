FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt "boto3>=1.34"

COPY functions /app/functions
COPY analyzer /app/analyzer
COPY models /app/models
COPY local /app/local

RUN mkdir -p /app/lambda-layers/python

ENV PYTHONPATH=/app:/app/lambda-layers/python \
    PYTHONUNBUFFERED=1

RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

ENTRYPOINT ["python", "/app/local/poller.py"]
