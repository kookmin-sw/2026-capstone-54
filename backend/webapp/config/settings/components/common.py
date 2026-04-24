"""
Django Common Settings
"""

from pathlib import Path

import environ

env = environ.Env()

SERVICE_NAME = env.str("SERVICE_NAME", default="MeFit")
# FIXME: 현재는 서비스명 미정

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

SECRET_KEY = env.str("SECRET_KEY")

DEBUG = env.bool("DEBUG", default=False)

SITE_ID = 1

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DEVELOPER = env.str("DEVELOPER", "Mefit")

# 파일 업로드 제한 (기본 2.5MB → 10MB로 확장)
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

__all__ = [
  "env",
  "BASE_DIR",
  "SECRET_KEY",
  "DEBUG",
  "SERVICE_NAME",
  "DEVELOPER",
  "SITE_ID",
  "WSGI_APPLICATION",
  "ASGI_APPLICATION",
  "FILE_UPLOAD_MAX_MEMORY_SIZE",
  "DATA_UPLOAD_MAX_MEMORY_SIZE",
]
