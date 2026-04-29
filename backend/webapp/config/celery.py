import os

from celery import Celery
from celery.signals import task_postrun, task_prerun, worker_process_init
from django.db import close_old_connections, connections

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("me_fit")

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# ─── DB 커넥션 누수 방지 시그널 ─────────────────────────────────────────────
# Celery 는 Django 의 request_started/request_finished 시그널을 발생시키지 않으므로
# CONN_MAX_AGE 를 설정해도 close_old_connections() 가 호출되지 않아 DB 커넥션이 영구히
# idle 상태로 남는다. 아래 시그널 핸들러로 fork 직후 / task 전후 명시적 정리한다.
#
# 참조: Django 공식 문서 - Persistent connections + Celery 패턴
#       2026-04-29 RDS 커넥션 고갈 인시던트 (backend/docs/incidents/) 후속 조치


@worker_process_init.connect
def _reset_db_connections_on_fork(**_kwargs):
  """prefork 자식이 부모의 socket fd 를 상속받지 않도록 fork 직후 모든 conn close."""
  for conn in connections.all():
    conn.close()


@task_prerun.connect
def _close_old_db_connections_before_task(**_kwargs):
  close_old_connections()


@task_postrun.connect
def _close_old_db_connections_after_task(**_kwargs):
  close_old_connections()
