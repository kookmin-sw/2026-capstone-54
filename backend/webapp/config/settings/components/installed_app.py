"""
Application Definitions
"""

ADMIN_APPS = [
  "unfold",
  "unfold.contrib.filters",
  "unfold.contrib.forms",
  "unfold.contrib.inlines",
  "unfold.contrib.import_export",
]

DJANGO_APPS = [
  "django.contrib.admin",
  "django.contrib.auth",
  "django.contrib.contenttypes",
  "django.contrib.sessions",
  "django.contrib.messages",
  "django.contrib.staticfiles",
]

PACKAGE_APPS = [
  # Django Postgres
  "django.contrib.postgres",
  "psqlextra",

  # CORS
  "corsheaders",

  # Django ADMIN Import Export
  "import_export",

  # Django Extensions
  "django_extensions",

  # REST Framework
  "rest_framework",
  "rest_framework_simplejwt",
  "rest_framework_simplejwt.token_blacklist",

  # Swagger Docs
  "drf_spectacular",

  # Django Filters
  "django_filters",

  # Celery
  "django_celery_beat",
  "django_celery_results",

  # Logging
  "django_guid",
  "django_structlog",
  "drf_api_logger",

  # WebSocket / SSE
  "channels",
]

PROJECT_APPS = [
  # 프로젝트 앱
  "common",
  "users",
  "api",
  "realtime_docs",
]

INSTALLED_APPS = ADMIN_APPS + DJANGO_APPS + PACKAGE_APPS + PROJECT_APPS

# realtime_docs: @ws_consumer / @sse_consumer 데코레이터가 적용된 모듈 목록
# 앱 시작 시 자동으로 import되어 레지스트리에 등록된다.
REALTIME_DOCS_CONSUMERS = [
  "api.v1.demo.consumers",
]

__all__ = [
  "INSTALLED_APPS",
  "REALTIME_DOCS_CONSUMERS",
]
