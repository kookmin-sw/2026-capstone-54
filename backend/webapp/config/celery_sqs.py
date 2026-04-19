import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("me_fit_sqs")

app.config_from_object("django.conf:settings", namespace="CELERY_SQS")

app.autodiscover_tasks(["interviews.tasks"])
