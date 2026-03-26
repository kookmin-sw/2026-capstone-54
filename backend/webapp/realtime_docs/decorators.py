"""
Consumer 문서화 데코레이터.

사용법::

    from realtime_docs.decorators import ws_consumer, sse_consumer

    @ws_consumer(
        path="/ws/notifications/",
        title="알림 WebSocket",
        description="사용자 실시간 알림 스트림",
        tags=["notifications"],
        receive_schema={"type": "object", "properties": {"action": {"type": "string"}}},
        send_schema={"type": "object", "properties": {"type": {"type": "string"}, "payload": {"type": "object"}}},
    )
    class NotificationConsumer(UserWebSocketConsumer):
        ...

    @sse_consumer(
        path="/sse/counter/",
        title="카운터 SSE",
        description="1초마다 카운터를 push하는 스트림",
        tags=["demo"],
        events=[
            {"name": "connected", "schema": {"type": "object", "properties": {"message": {"type": "string"}}}},
            {"name": "tick", "schema": {"type": "object", "properties": {"counter": {"type": "integer"}}}},
            {"name": "done", "schema": {"type": "object", "properties": {"message": {"type": "string"}}}},
        ],
    )
    class CounterSseConsumer(SseConsumer):
        ...
"""

from __future__ import annotations

from typing import Any

from .registry import ConsumerMeta, registry


def ws_consumer(
  path: str,
  *,
  title: str = "",
  description: str = "",
  tags: list[str] | None = None,
  send_schema: dict[str, Any] | None = None,
  receive_schema: dict[str, Any] | None = None,
) -> Any:
  """WebSocket consumer 를 문서 레지스트리에 등록하는 데코레이터."""

  def decorator(cls: type) -> type:
    registry.register(
      ConsumerMeta(
        cls=cls,
        protocol="ws",
        path=path,
        title=title or cls.__name__,
        description=description or (cls.__doc__ or "").strip(),
        tags=tags or [],
        send_schema=send_schema,
        receive_schema=receive_schema,
        events=[],
      )
    )
    return cls

  return decorator


def sse_consumer(
  path: str,
  *,
  title: str = "",
  description: str = "",
  tags: list[str] | None = None,
  send_schema: dict[str, Any] | None = None,
  events: list[dict[str, Any]] | None = None,
) -> Any:
  """SSE consumer 를 문서 레지스트리에 등록하는 데코레이터."""

  def decorator(cls: type) -> type:
    registry.register(
      ConsumerMeta(
        cls=cls,
        protocol="sse",
        path=path,
        title=title or cls.__name__,
        description=description or (cls.__doc__ or "").strip(),
        tags=tags or [],
        send_schema=send_schema,
        receive_schema=None,
        events=events or [],
      )
    )
    return cls

  return decorator
