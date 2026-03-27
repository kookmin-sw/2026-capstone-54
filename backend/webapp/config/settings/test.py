"""
Django Test Settings

CI 환경 및 테스트 실행을 위한 설정.
개발/운영 환경과 분리하여 테스트 전용 설정을 관리합니다.
"""

from .base import *  # noqa: F401, F403

# 테스트 환경에서는 DEBUG 비활성화
DEBUG = False

ENVIRONMENT = "test"

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # noqa: F405

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'  # noqa: F405

STORAGES = {
  "default": {
    "BACKEND": "django.core.files.storage.FileSystemStorage",
  },
  "staticfiles": {
    "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
  },
}

# 테스트 실행 속도 향상을 위한 비밀번호 해셔
PASSWORD_HASHERS = [
  "django.contrib.auth.hashers.MD5PasswordHasher",
]

# 테스트 환경에서 이메일 백엔드
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# 테스트 환경에서 캐시 비활성화
CACHES = {
  "default": {
    "BACKEND": "django.core.cache.backends.dummy.DummyCache",
  }
}

# 테스트 환경에서 로깅 최소화
LOGGING = {
  "version": 1,
  "disable_existing_loggers": True,
  "handlers": {
    "null": {
      "class": "logging.NullHandler",
    },
  },
  "root": {
    "handlers": ["null"],
    "level": "CRITICAL",
  },
}

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"

# Disable Celery Beat scheduler for tests
CELERY_BEAT_SCHEDULER = None
