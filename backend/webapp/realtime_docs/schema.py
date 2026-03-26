"""
AsyncAPI 3.0 스펙 생성기.

request 의 scheme(http/https/ws/wss)을 감지해 서버 URL을 자동으로 구성한다.
"""

from __future__ import annotations

from typing import Any

from django.http import HttpRequest

from .registry import ConsumerMeta, registry


def _ws_scheme(request: HttpRequest) -> str:
  """HTTP scheme 에 대응하는 WebSocket scheme 을 반환한다."""
  return "wss" if request.is_secure() else "ws"


def _http_scheme(request: HttpRequest) -> str:
  return "https" if request.is_secure() else "http"


def _build_server_url(request: HttpRequest, protocol: str) -> str:
  host = request.get_host()  # host:port 포함
  if protocol == "ws":
    scheme = _ws_scheme(request)
  else:
    scheme = _http_scheme(request)
  return f"{scheme}://{host}"


def _consumer_to_channel(meta: ConsumerMeta, server_name: str) -> dict[str, Any]:
  """ConsumerMeta → AsyncAPI channel 객체."""
  channel: dict[str, Any] = {
    "address": meta.path,
    "description": meta.description,
    "servers": [{
      "$ref": f"#/servers/{server_name}"
    }],
    "messages": {},
  }

  if meta.protocol == "ws":
    if meta.receive_schema:
      channel["messages"]["ClientMessage"] = {
        "name": "ClientMessage",
        "title": "Client → Server",
        "payload": meta.receive_schema,
      }
    if meta.send_schema:
      channel["messages"]["ServerMessage"] = {
        "name": "ServerMessage",
        "title": "Server → Client",
        "payload": meta.send_schema,
      }
  else:  # sse
    for ev in meta.events:
      name = ev.get("name", "event")
      channel["messages"][name] = {
        "name": name,
        "title": f"event: {name}",
        "payload": ev.get("schema", {"type": "object"}),
      }

  return channel


def generate_asyncapi_spec(request: HttpRequest) -> dict[str, Any]:
  """레지스트리를 순회해 AsyncAPI 3.0 JSON 스펙을 생성한다."""
  consumers = registry.all()

  ws_server_url = _build_server_url(request, "ws")
  http_server_url = _build_server_url(request, "http")

  spec: dict[str, Any] = {
    "asyncapi": "3.0.0",
    "info": {
      "title": "Realtime API",
      "version": "1.0.0",
      "description": "WebSocket / SSE consumer 문서",
    },
    "servers": {
      "websocket": {
        "host": request.get_host(),
        "protocol": _ws_scheme(request),
        "description": f"WebSocket server ({ws_server_url})",
      },
      "sse": {
        "host": request.get_host(),
        "protocol": _http_scheme(request),
        "description": f"SSE server ({http_server_url})",
      },
    },
    "channels": {},
    "operations": {},
  }

  for meta in consumers:
    server_name = "websocket" if meta.protocol == "ws" else "sse"
    channel_id = meta.cls.__name__
    spec["channels"][channel_id] = _consumer_to_channel(meta, server_name)

    # operations
    if meta.protocol == "ws":
      spec["operations"][f"{channel_id}_receive"] = {
        "action": "receive",
        "channel": {
          "$ref": f"#/channels/{channel_id}"
        },
        "title": f"{meta.title} — receive",
        "tags": [{
          "name": t
        } for t in meta.tags],
      }
      spec["operations"][f"{channel_id}_send"] = {
        "action": "send",
        "channel": {
          "$ref": f"#/channels/{channel_id}"
        },
        "title": f"{meta.title} — send",
        "tags": [{
          "name": t
        } for t in meta.tags],
      }
    else:
      spec["operations"][f"{channel_id}_subscribe"] = {
        "action": "receive",
        "channel": {
          "$ref": f"#/channels/{channel_id}"
        },
        "title": meta.title,
        "tags": [{
          "name": t
        } for t in meta.tags],
      }

  return spec
