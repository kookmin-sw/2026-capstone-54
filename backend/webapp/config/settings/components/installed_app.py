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

  # Django ADMIN Import Export
  "import_export",

  # Django Extensions
  "django_extensions",

  # REST Framework
  "rest_framework",
  "rest_framework.authtoken",
  "rest_framework_simplejwt",
  "rest_framework_simplejwt.token_blacklist",

  # Swagger Docs
  "drf_spectacular",

  # Django Filters
  "django_filters",

  # Auth
  "dj_rest_auth",
  "dj_rest_auth.registration",
]

PROJECT_APPS = [
  # 프로젝트 앱
  "common",
]

INSTALLED_APPS = ADMIN_APPS + DJANGO_APPS + PACKAGE_APPS + PROJECT_APPS

__all__ = [
  "INSTALLED_APPS",
]
