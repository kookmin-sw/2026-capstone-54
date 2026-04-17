"""
ASGI config for backend project.

HTTP 요청 중 SSE 경로는 Channels HTTP consumer 로, 나머지는 Django ASGI 앱으로 분기한다.
WebSocket 요청은 Channels WebSocket consumer 로 분기한다.

SSE consumer 추가 방법:
    1. 앱 디렉토리에 consumers.py 작성 (SseConsumer 상속)
    2. 앱 디렉토리의 routing.py 에 sse_urlpatterns 정의
    3. 아래 sse_urlpatterns 리스트에 추가

WebSocket consumer 추가 방법:
    1. 앱 디렉토리에 consumers.py 작성 (BaseWebSocketConsumer 상속)
    2. 앱 디렉토리의 routing.py 에 websocket_urlpatterns 정의
    3. 아래 websocket_urlpatterns 리스트에 추가
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.urls import re_path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

# Django ASGI 앱은 AppRegistry 초기화를 위해 반드시 먼저 생성해야 한다.
django_asgi_app = get_asgi_application()

# AppRegistry 초기화 이후에 consumer import 가능
from api.v1.demo.routing import sse_urlpatterns as demo_sse_urlpatterns  # noqa: E402
from api.v1.demo.routing import websocket_urlpatterns as demo_ws_urlpatterns  # noqa: E402
from api.v1.interviews.routing import sse_urlpatterns as interviews_sse_urlpatterns  # noqa: E402
from api.v1.interviews.routing import websocket_urlpatterns as interviews_ws_urlpatterns  # noqa: E402
from api.v1.job_descriptions.routing import sse_urlpatterns as job_descriptions_sse_urlpatterns  # noqa: E402
from api.v1.resumes.routing import sse_urlpatterns as resumes_sse_urlpatterns  # noqa: E402

# SSE URL 패턴 — Django middleware(ATOMIC_REQUESTS 등)를 우회해 직접 처리한다.
sse_urlpatterns = [
  *demo_sse_urlpatterns,
  *interviews_sse_urlpatterns,
  *resumes_sse_urlpatterns,
  *job_descriptions_sse_urlpatterns,
]

# WebSocket URL 패턴
websocket_urlpatterns = [
  *demo_ws_urlpatterns,
  *interviews_ws_urlpatterns,
]

application = ProtocolTypeRouter(
  {
    # HTTP: SSE 경로는 Channels consumer, 나머지는 Django ASGI 앱으로 위임
    "http": URLRouter([
      *sse_urlpatterns,
      re_path(r"", django_asgi_app),  # fallback → Django
    ]),
    # WebSocket
    "websocket": AllowedHostsOriginValidator(AuthMiddlewareStack(URLRouter(websocket_urlpatterns))),
  }
)
