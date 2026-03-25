"""
WebSocket base consumers.

BaseWebSocketConsumer  — 일반 WebSocket 베이스
UserWebSocketConsumer  — 인증된 특정 사용자 전용 WebSocket 베이스

사용법 (일반)::

    from common.consumers import BaseWebSocketConsumer

    class EchoConsumer(BaseWebSocketConsumer):
        async def handle_message(self, data: dict) -> None:
            await self.reply({"echo": data})

사용법 (사용자 전용)::

    from common.consumers import UserWebSocketConsumer

    class NotificationConsumer(UserWebSocketConsumer):
        # handle_connect / handle_disconnect / handle_message 오버라이드 가능
        async def handle_message(self, data: dict) -> None:
            await self.reply({"received": data})

    # 티켓 발급 후 연결:
    # 1. POST /api/v1/realtime/ws-ticket/ → {"ticket": "<ticket>"}
    # 2. ws://host/ws/notifications/?ticket=<ticket>

    # 외부(Celery task 등)에서 특정 사용자에게 push:
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    async_to_sync(get_channel_layer().group_send)(
        f"user_{user_id}",
        {"type": "user.message", "payload": {"text": "알림 도착"}},
    )
"""

from __future__ import annotations

import json

import structlog
from channels.generic.websocket import AsyncWebsocketConsumer

logger = structlog.get_logger(__name__)


class BaseWebSocketConsumer(AsyncWebsocketConsumer):
  """프로젝트 공통 WebSocket consumer 베이스.

    서브클래스는 handle_connect / handle_disconnect / handle_message 를 오버라이드한다.
    JSON 직렬화/역직렬화와 에러 처리는 베이스에서 담당한다.
    """

  async def connect(self) -> None:
    await self.accept()
    logger.info("ws_connected", channel=self.channel_name)
    await self.handle_connect()

  async def disconnect(self, code: int) -> None:
    logger.info("ws_disconnected", channel=self.channel_name, code=code)
    await self.handle_disconnect(code)

  async def receive(self, text_data: str = "", bytes_data: bytes = b"") -> None:
    try:
      data = json.loads(text_data) if text_data else {}
    except json.JSONDecodeError:
      await self.reply({"error": "invalid JSON"})
      return
    await self.handle_message(data)

  async def reply(self, data: dict) -> None:
    """연결된 클라이언트에 JSON 메시지를 전송한다."""
    await self.send(text_data=json.dumps(data, ensure_ascii=False))

  # ── 서브클래스 훅 ────────────────────────────────────────────────────────

  async def handle_connect(self) -> None:
    """연결 수립 후 호출된다. 그룹 참가 등 초기화 로직을 여기에 작성한다."""

  async def handle_disconnect(self, code: int) -> None:
    """연결 종료 시 호출된다. 그룹 탈퇴 등 정리 로직을 여기에 작성한다."""

  async def handle_message(self, data: dict) -> None:
    """클라이언트 메시지 수신 시 호출된다. 서브클래스에서 필요 시 구현한다."""


class UserWebSocketConsumer(BaseWebSocketConsumer):
  """인증된 특정 사용자 전용 WebSocket consumer 베이스.

    연결 시 JWT 토큰을 검증하고, 해당 사용자의 개인 그룹(user_{id})에 자동 참가한다.
    인증 실패 시 연결을 즉시 닫는다.

    채널 레이어를 통해 외부(Celery task 등)에서 특정 사용자에게 메시지를 push할 수 있다.

    그룹 이름 규칙: "user_{user_id}"
    메시지 type 규칙: "user.message" (Channels는 type의 '.'을 '_'로 변환해 메서드를 호출한다)
    """

  _user_group: str = ""

  async def connect(self) -> None:
    user = await self._authenticate()
    if user is None:
      await self.close(code=4001)
      return

    self.user = user
    self._user_group = f"user_{user.pk}"

    await self.accept()
    await self.channel_layer.group_add(self._user_group, self.channel_name)
    logger.info("ws_user_connected", channel=self.channel_name, user_id=user.pk)
    await self.handle_connect()

  async def disconnect(self, code: int) -> None:
    if self._user_group:
      await self.channel_layer.group_discard(self._user_group, self.channel_name)
    logger.info("ws_user_disconnected", channel=self.channel_name, code=code)
    await self.handle_disconnect(code)

  # ── 채널 레이어 메시지 핸들러 ────────────────────────────────────────────
  # group_send({"type": "user.message", "payload": {...}}) 호출 시 실행된다.

  async def user_message(self, event: dict) -> None:
    """채널 레이어에서 수신한 메시지를 클라이언트로 전달한다."""
    await self.reply(event.get("payload", {}))

  # ── 사용자 재조회 ─────────────────────────────────────────────────────────

  async def get_fresh_user(self):
    """DB에서 사용자를 재조회해 최신 상태를 반환한다.

        self.user 는 연결 시점의 스냅샷이므로, 권한 체크나 중요한 데이터 처리 시
        이 메서드로 최신 상태를 확인한다. 계정이 비활성화됐으면 None 을 반환한다.

        사용 예::

            async def handle_message(self, data: dict) -> None:
                user = await self.get_fresh_user()
                if user is None:
                    await self.close(code=4001)
                    return
                # 이후 user 로 처리
        """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    try:
      return await User.objects.aget(pk=self.user.pk, is_active=True)
    except User.DoesNotExist:
      return None

  # ── 인증 ─────────────────────────────────────────────────────────────────

  async def _authenticate(self):
    """쿼리스트링의 단기 티켓을 검증하고 User 인스턴스를 반환한다.

        검증 실패 시 None 을 반환한다.
        티켓은 1회용이며 검증 즉시 삭제된다 (60초 TTL).

        URL 예시: ws://host/ws/notifications/?ticket=<ticket>

        티켓 발급: POST /api/v1/realtime/ws-ticket/
        """
    from django.contrib.auth import get_user_model
    from django.core.cache import cache

    User = get_user_model()

    query_string = self.scope.get("query_string", b"").decode()
    params = dict(pair.split("=", 1) for pair in query_string.split("&") if "=" in pair)
    ticket = params.get("ticket", "")
    if not ticket:
      logger.warning("ws_auth_missing_ticket")
      return None

    cache_key = f"ws_ticket:{ticket}"
    user_id = await cache.aget(cache_key)
    if user_id is None:
      logger.warning("ws_auth_invalid_ticket", ticket_prefix=ticket[:10])
      return None

    # 1회용 — 즉시 삭제
    await cache.adelete(cache_key)

    try:
      return await User.objects.aget(pk=user_id, is_active=True)
    except User.DoesNotExist:
      logger.warning("ws_auth_user_not_found", user_id=user_id)
      return None
