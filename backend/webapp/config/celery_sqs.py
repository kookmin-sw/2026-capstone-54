import os

from celery import Celery
from celery.signals import task_postrun, task_prerun, worker_process_init
from django.conf import settings
from django.db import close_old_connections, connections

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("me_fit_sqs")

app.config_from_object("django.conf:settings", namespace="CELERY_SQS")

app.autodiscover_tasks(["interviews.tasks"])

# ─── DB 커넥션 누수 방지 시그널 (celery.py 와 동일) ─────────────────────────
# 자세한 사유는 backend/webapp/config/celery.py 상단 주석 및
# backend/docs/incidents/2026-04-29-rds-connection-exhaustion.md 참조.


@worker_process_init.connect
def _reset_db_connections_on_fork(**_kwargs):
  for conn in connections.all():
    conn.close()


@task_prerun.connect
def _close_old_db_connections_before_task(**_kwargs):
  if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
    return
  close_old_connections()


@task_postrun.connect
def _close_old_db_connections_after_task(**_kwargs):
  if getattr(settings, "CELERY_TASK_ALWAYS_EAGER", False):
    return
  close_old_connections()
