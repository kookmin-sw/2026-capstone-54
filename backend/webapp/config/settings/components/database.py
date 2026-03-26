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

DATABASES = {
  "default": {
    "ENGINE": DATABASE_ENGINE,
    "NAME": DATABASE_NAME,
    "USER": POSTGRES_USER,
    "PASSWORD": POSTGRES_PASSWORD,
    "HOST": POSTGRES_HOST,
    "PORT": POSTGRES_PORT,
    "ATOMIC_REQUESTS": True,
    "CONN_MAX_AGE": 600,  # 10분 connection pooling
    "OPTIONS": {
      "connect_timeout": 10,
      "options": "-c statement_timeout=30000",  # 30초 쿼리 타임아웃
    },
    "TEST": {
      "NAME": env.str("TEST_DATABASE_NAME", default=""),
      "USER": env.str("TEST_POSTGRES_USER", default=""),
      "PASSWORD": env.str("TEST_POSTGRES_PASSWORD", default=""),
      "HOST": env.str("TEST_POSTGRES_HOST", default=""),
      "PORT": env.str("TEST_POSTGRES_PORT", default=""),
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
