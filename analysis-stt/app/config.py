"""analysis-stt 의 환경 변수 / 상수."""

import os

from dotenv import load_dotenv

load_dotenv()

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", "us-east-1")
S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL", "") or None
S3_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "") or None
S3_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "") or None

STT_MODEL_SIZE = os.getenv("STT_MODEL_SIZE", "small")
STT_DEVICE = os.getenv("STT_DEVICE", "cpu")
STT_COMPUTE_TYPE = os.getenv("STT_COMPUTE_TYPE", "int8")
STT_DEFAULT_LANGUAGE = os.getenv("STT_DEFAULT_LANGUAGE", "ko")

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

BACKEND_CALLBACK_TASK_NAME = os.getenv(
  "BACKEND_CALLBACK_TASK_NAME",
  "interviews.tasks.save_transcript_result_task.SaveTranscriptResultTask",
)
BACKEND_CALLBACK_QUEUE = os.getenv("BACKEND_CALLBACK_QUEUE", "celery")
