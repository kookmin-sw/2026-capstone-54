from django.urls import path

from .consumers import (
  AuthCounterSseConsumer,
  AuthEchoDemoConsumer,
  CounterSseConsumer,
  EchoDemoConsumer,
)

# SSE — ASGI HTTP router 에서 직접 처리 (Django middleware 우회)
sse_urlpatterns = [
  path("sse/demo/counter/", CounterSseConsumer.as_asgi()),
  path("sse/demo/auth-counter/", AuthCounterSseConsumer.as_asgi()),
]

# WebSocket
websocket_urlpatterns = [
  path("ws/demo/echo/", EchoDemoConsumer.as_asgi()),
  path("ws/demo/auth-echo/", AuthEchoDemoConsumer.as_asgi()),
]
