"""
Django User Authentication Settings
"""

from datetime import timedelta

from .common import env

# Custom User Model
AUTH_USER_MODEL = "users.User"

# Email Verification
EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES = 10

# Email
EMAIL_BACKEND = env(
  "EMAIL_BACKEND",
  default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
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
  "EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES",
  "EMAIL_BACKEND",
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USE_TLS",
  "EMAIL_HOST_USER",
  "EMAIL_HOST_PASSWORD",
  "DEFAULT_FROM_EMAIL",
  "SIMPLE_JWT",
]
