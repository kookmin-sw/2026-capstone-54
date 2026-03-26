"""
Demo consumers — WebSocket echo + SSE counter + 인증 demo.

EchoDemoConsumer        : 클라이언트 메시지를 그대로 echo + 서버 타임스탬프 추가
CounterSseConsumer      : 1초마다 카운터 값을 push하는 SSE 스트림
AuthEchoDemoConsumer    : JWT 인증 후 user_id/email을 포함해 echo하는 WebSocket
AuthCounterSseConsumer  : JWT 인증 후 user_id/email을 포함해 카운터를 push하는 SSE
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from common.consumers.sse import SseConsumer, UserSseConsumer
from common.consumers.websocket import BaseWebSocketConsumer, UserWebSocketConsumer
from realtime_docs.decorators import sse_consumer, ws_consumer


@ws_consumer(
  path="/ws/demo/echo/",
  title="Echo WebSocket",
  description="수신한 메시지를 그대로 echo하고 서버 타임스탬프를 추가해 반환한다.",
  tags=["demo"],
  receive_schema={
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "example": "hello"
      },
    },
  },
  send_schema={
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "example": "echo"
      },
      "payload": {
        "type": "object"
      },
      "server_time": {
        "type": "string",
        "format": "date-time"
      },
    },
  },
)
class EchoDemoConsumer(BaseWebSocketConsumer):
  """수신한 메시지를 echo하고 서버 타임스탬프를 추가해 반환한다."""

  async def handle_connect(self) -> None:
    await self.reply({"type": "connected", "message": "Echo server ready"})

  async def handle_message(self, data: dict) -> None:
    await self.reply({
      "type": "echo",
      "payload": data,
      "server_time": datetime.now(tz=timezone.utc).isoformat(),
    })


@sse_consumer(
  path="/sse/demo/counter/",
  title="Counter SSE",
  description="1초마다 카운터 값을 push한다. 0~20까지 전송 후 done 이벤트와 함께 종료된다.",
  tags=["demo"],
  events=[
    {
      "name": "connected",
      "schema": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string"
          },
          "message": {
            "type": "string"
          }
        },
      },
    },
    {
      "name": "tick",
      "schema": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string"
          },
          "counter": {
            "type": "integer",
            "example": 5
          },
          "server_time": {
            "type": "string",
            "format": "date-time"
          },
        },
      },
    },
    {
      "name": "done",
      "schema": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string"
          },
          "message": {
            "type": "string"
          }
        },
      },
    },
  ],
)
class CounterSseConsumer(SseConsumer):
  """1초마다 카운터 값을 SSE로 push한다."""

  async def stream(self) -> None:
    counter = 0
    await self.send_event({"type": "connected", "message": "Counter stream started"}, event="connected")
    while not self.disconnected and counter <= 20:
      await self.send_event(
        {
          "type": "tick",
          "counter": counter,
          "server_time": datetime.now(tz=timezone.utc).isoformat(),
        },
        event="tick",
      )
      counter += 1
      await asyncio.sleep(1)

    if not self.disconnected:
      await self.send_event({"type": "done", "message": "Stream complete"}, event="done")


@ws_consumer(
  path="/ws/demo/auth-echo/",
  title="Auth Echo WebSocket",
  description="JWT 인증 후 user_id/email을 포함해 echo한다. ?token=<access_token> 으로 연결.",
  tags=["demo", "auth"],
  receive_schema={
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "example": "hello"
      },
    },
  },
  send_schema={
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "example": "echo"
      },
      "user_id": {
        "type": "integer"
      },
      "user_email": {
        "type": "string",
        "format": "email"
      },
      "payload": {
        "type": "object"
      },
      "server_time": {
        "type": "string",
        "format": "date-time"
      },
    },
  },
)
class AuthEchoDemoConsumer(UserWebSocketConsumer):
  """JWT 인증 후 user_id/email을 포함해 echo한다."""

  async def handle_connect(self) -> None:
    await self.reply(
      {
        "type": "connected",
        "user_id": self.user.pk,
        "user_email": self.user.email,
        "message": "Authenticated echo server ready",
      }
    )

  async def handle_message(self, data: dict) -> None:
    await self.reply(
      {
        "type": "echo",
        "user_id": self.user.pk,
        "user_email": self.user.email,
        "payload": data,
        "server_time": datetime.now(tz=timezone.utc).isoformat(),
      }
    )


@sse_consumer(
  path="/sse/demo/auth-counter/",
  title="Auth Counter SSE",
  description="JWT 인증 후 user_id/email을 포함해 카운터를 push한다. ?token=<access_token> 으로 연결.",
  tags=["demo", "auth"],
  events=[
    {
      "name": "connected",
      "schema": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string"
          },
          "user_id": {
            "type": "integer"
          },
          "user_email": {
            "type": "string",
            "format": "email"
          },
          "message": {
            "type": "string"
          },
        },
      },
    },
    {
      "name": "tick",
      "schema": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string"
          },
          "user_id": {
            "type": "integer"
          },
          "user_email": {
            "type": "string",
            "format": "email"
          },
          "counter": {
            "type": "integer"
          },
          "server_time": {
            "type": "string",
            "format": "date-time"
          },
        },
      },
    },
    {
      "name": "done",
      "schema": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string"
          },
          "message": {
            "type": "string"
          },
        },
      },
    },
  ],
)
class AuthCounterSseConsumer(UserSseConsumer):
  """JWT 인증 후 user_id/email을 포함해 카운터를 push한다."""

  async def stream(self) -> None:
    counter = 0
    await self.send_event(
      {
        "type": "connected",
        "user_id": self.user.pk,
        "user_email": self.user.email,
        "message": "Authenticated counter stream started",
      },
      event="connected",
    )
    while not self.disconnected and counter <= 20:
      await self.send_event(
        {
          "type": "tick",
          "user_id": self.user.pk,
          "user_email": self.user.email,
          "counter": counter,
          "server_time": datetime.now(tz=timezone.utc).isoformat(),
        },
        event="tick",
      )
      counter += 1
      await asyncio.sleep(1)

    if not self.disconnected:
      await self.send_event({"type": "done", "message": "Stream complete"}, event="done")
