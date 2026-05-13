"""
Django Cache 설정.

Redis를 기본 캐시 백엔드로 사용한다.
고가용성 환경(멀티 Pod/컨테이너)에서 모든 인스턴스가 동일한 캐시에 접근한다.

WebSocket 단기 티켓 등 공유 상태가 필요한 기능에 사용된다.
"""

from .celery import REDIS_HOST, REDIS_PORT

CACHES = {
  "default": {
    "BACKEND": "django.core.cache.backends.redis.RedisCache",
    "LOCATION": f"redis://{REDIS_HOST}:{REDIS_PORT}/1",
  }
}

__all__ = ["CACHES"]
