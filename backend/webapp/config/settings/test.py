"""
Django Test Settings

CI 환경 및 테스트 실행을 위한 설정.
개발/운영 환경과 분리하여 테스트 전용 설정을 관리합니다.
"""

from .base import *  # noqa: F401, F403

# 테스트 환경에서는 DEBUG 비활성화
DEBUG = False

ENVIRONMENT = "test"

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"  # noqa: F405

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"  # noqa: F405

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

# 테스트 환경에서 채널 레이어는 Redis 없이 인메모리로 동작
CHANNEL_LAYERS = {
  "default": {
    "BACKEND": "channels.layers.InMemoryChannelLayer",
  }
}

# 테스트에서는 Flower를 사용하지 않으므로 더미 값으로 scheme 검증만 통과
FLOWER_INTERNAL_URL = "http://localhost:5555"
# LiteLLM Gateway 도 테스트에서 사용하지 않음 — 빈 문자열이면 프록시 view 가 503 반환.
LLM_GATEWAY_INTERNAL_URL = ""

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"

# Disable Celery Beat scheduler for tests
CELERY_BEAT_SCHEDULER = None

# 테스트 환경에서 persistent connection 비활성화 (teardown 시 DB drop 실패 방지)
# CONN_HEALTH_CHECKS 는 활성화: Celery eager 태스크의 close_old_connections() 가 닫은
# stale connection 을 후속 테스트 setUp 이 재사용하다 OperationalError 가 나는 문제를 차단.
DATABASES["default"]["CONN_MAX_AGE"] = 0  # noqa: F405
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True  # noqa: F405

# 테스트 환경에서는 OPENAI API를 직접 접근하지 않게 한다.
OPENAI_API_KEY = "demo-api-key"
