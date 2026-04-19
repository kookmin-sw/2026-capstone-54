from .common import env

CELERY_SQS_BROKER_URL = env.str("CELERY_SQS_BROKER_URL", default="sqs://")
CELERY_SQS_BROKER_TRANSPORT_OPTIONS = {
  "region": env.str("AWS_S3_REGION_NAME", default="us-east-1"),
  "visibility_timeout": 3600,
  "wait_time_seconds": 20,
  "polling_interval": 1,
  "predefined_queues": {
    "mefit-video-step-complete": {
      "url": env.str("VIDEO_STEP_COMPLETE_SQS_URL", default=""),
    },
  },
}

_endpoint_url = env.str("AWS_ENDPOINT_URL", default="") or env.str("VIDEO_S3_ENDPOINT_URL", default="")
if _endpoint_url:
  CELERY_SQS_BROKER_TRANSPORT_OPTIONS["endpoint_url"] = _endpoint_url

CELERY_SQS_TASK_DEFAULT_QUEUE = "mefit-video-step-complete"
CELERY_SQS_ACCEPT_CONTENT = ["application/json", "json"]
CELERY_SQS_TASK_SERIALIZER = "json"
CELERY_SQS_RESULT_BACKEND = None
CELERY_SQS_TASK_ACKS_LATE = True
CELERY_SQS_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_SQS_WORKER_ENABLE_REMOTE_CONTROL = False
CELERY_SQS_WORKER_SEND_TASK_EVENTS = False

__all__ = [
  "CELERY_SQS_BROKER_URL",
  "CELERY_SQS_BROKER_TRANSPORT_OPTIONS",
  "CELERY_SQS_TASK_DEFAULT_QUEUE",
  "CELERY_SQS_ACCEPT_CONTENT",
  "CELERY_SQS_TASK_SERIALIZER",
  "CELERY_SQS_RESULT_BACKEND",
  "CELERY_SQS_TASK_ACKS_LATE",
  "CELERY_SQS_WORKER_PREFETCH_MULTIPLIER",
  "CELERY_SQS_WORKER_ENABLE_REMOTE_CONTROL",
  "CELERY_SQS_WORKER_SEND_TASK_EVENTS",
]
