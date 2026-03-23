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

__all__ = [
  "env",
  "BASE_DIR",
  "SECRET_KEY",
  "DEBUG",
  "SERVICE_NAME",
  "SITE_ID",
  "WSGI_APPLICATION",
  "ASGI_APPLICATION",
]
