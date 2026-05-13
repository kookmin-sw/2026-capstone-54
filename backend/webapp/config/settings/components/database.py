"""
Django Database Settings
"""

from .common import env

# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASE_ENGINE = env.str("DATABASE_ENGINE", default="psqlextra.backend")
DATABASE_NAME = env.str("DATABASE_NAME")
POSTGRES_USER = env.str("POSTGRES_USER")
POSTGRES_PASSWORD = env.str("POSTGRES_PASSWORD")
POSTGRES_HOST = env.str("POSTGRES_HOST")
POSTGRES_PORT = env.str("POSTGRES_PORT", default="5432")

# pg_stat_activity 에서 어느 프로세스가 conn 을 점유하는지 식별하기 위한 라벨.
# 각 K8s Deployment 가 DJANGO_APPLICATION_NAME 환경변수로 다른 값 주입 (예: mefit-api,
# mefit-celery-worker, mefit-sqs-celery-worker, mefit-celery-beat).
DJANGO_APPLICATION_NAME = env.str("DJANGO_APPLICATION_NAME", default="mefit-backend")

DATABASES = {
  "default": {
    "ENGINE": DATABASE_ENGINE,
    "NAME": DATABASE_NAME,
    "USER": POSTGRES_USER,
    "PASSWORD": POSTGRES_PASSWORD,
    "HOST": POSTGRES_HOST,
    "PORT": POSTGRES_PORT,
    "ATOMIC_REQUESTS": True,
    "CONN_MAX_AGE": env.int("CONN_MAX_AGE", default=600),  # 환경변수로 제어 가능
    "CONN_HEALTH_CHECKS": True,  # Django 4.1+: 연결 상태 자동 체크
    "OPTIONS": {
      "connect_timeout": 10,
      "options": "-c statement_timeout=30000",  # 30초 쿼리 타임아웃
      "application_name": DJANGO_APPLICATION_NAME,
    },
    "TEST": {
      "NAME": env.str("TEST_DATABASE_NAME", default=""),
      "USER": POSTGRES_USER,
      "PASSWORD": POSTGRES_PASSWORD,
      "HOST": POSTGRES_HOST,
      "PORT": POSTGRES_PORT,
    },
  }
}

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

__all__ = [
  "DEFAULT_AUTO_FIELD",
  "DATABASES",
]
