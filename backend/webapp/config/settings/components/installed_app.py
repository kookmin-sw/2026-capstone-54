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
]

PROJECT_APPS = [
  # 프로젝트 앱
  "common",
]

INSTALLED_APPS = ADMIN_APPS + DJANGO_APPS + PACKAGE_APPS + PROJECT_APPS

__all__ = [
  "INSTALLED_APPS",
]
