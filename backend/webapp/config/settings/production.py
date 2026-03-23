from datetime import timedelta

from .base import *  # noqa: F401, F403

SIMPLE_JWT = {
  **SIMPLE_JWT,  # noqa: F405
  "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
}

DEBUG = False
