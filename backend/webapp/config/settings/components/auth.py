"""
Django User Authentication Settings
"""

from datetime import timedelta
from .common import env

# Custom User Model
AUTH_USER_MODEL = "users.User"

DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@mefit.chat")

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
  {
    'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
  },
  {
    'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
  },
  {
    'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
  },
  {
    'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
  },
]

# SimpleJWT
SIMPLE_JWT = {
  "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
  "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
  "ROTATE_REFRESH_TOKENS": True,
  "BLACKLIST_AFTER_ROTATION": True,
}

__all__ = [
  "AUTH_USER_MODEL",
  "AUTH_PASSWORD_VALIDATORS",
  "SIMPLE_JWT",
]
