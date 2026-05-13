"""
Consumer 레지스트리.

@ws_consumer / @sse_consumer 데코레이터가 consumer 클래스를 등록한다.
schema.py 가 이 레지스트리를 읽어 AsyncAPI 스펙을 생성한다.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class ConsumerMeta:
  """등록된 consumer 의 메타데이터."""

  cls: type
  protocol: str  # "ws" | "sse"
  path: str  # URL 경로 (예: "/ws/demo/echo/")
  title: str  # 표시 이름
  description: str  # 설명
  tags: list[str]  # 그룹 태그
  send_schema: dict[str, Any] | None  # 서버 → 클라이언트 메시지 JSON Schema
  receive_schema: dict[str, Any] | None  # 클라이언트 → 서버 메시지 JSON Schema (WS only)
  events: list[dict[str, Any]]  # SSE 이벤트 목록 [{"name": ..., "schema": ...}]

  @property
  def name(self) -> str:
    """템플릿에서 사용할 클래스 이름 (dunder 없이 접근 가능)."""
    return self.cls.__name__

  @property
  def auth_required(self) -> bool:
    """UserWebSocketConsumer / UserSseConsumer 상속 여부로 인증 필요 여부를 판단한다."""
    from common.consumers.sse import UserSseConsumer
    from common.consumers.websocket import UserWebSocketConsumer
    return issubclass(self.cls, (UserWebSocketConsumer, UserSseConsumer))


class _ConsumerRegistry:
  """전역 consumer 레지스트리 (싱글턴)."""

  def __init__(self) -> None:
    self._consumers: list[ConsumerMeta] = []

  def register(self, meta: ConsumerMeta) -> None:
    self._consumers.append(meta)

  def all(self) -> list[ConsumerMeta]:
    return list(self._consumers)

  def by_protocol(self, protocol: str) -> list[ConsumerMeta]:
    return [c for c in self._consumers if c.protocol == protocol]


registry = _ConsumerRegistry()
