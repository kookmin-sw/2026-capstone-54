"""
Django Channels — Channel Layer 설정.

development / production 모두 Redis channel layer 를 사용한다.
"""

from .celery import REDIS_HOST, REDIS_PORT

CHANNEL_LAYERS = {
  "default": {
    "BACKEND": "channels_redis.core.RedisChannelLayer",
    "CONFIG": {
      "hosts": [(REDIS_HOST, int(REDIS_PORT))],
    },
  }
}

__all__ = ["CHANNEL_LAYERS"]
