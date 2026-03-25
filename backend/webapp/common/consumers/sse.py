"""
SSE (Server-Sent Events) base consumers.

SseConsumer      — 일반 SSE 베이스
UserSseConsumer  — 인증된 특정 사용자 전용 SSE 베이스

Channels HTTP long-poll consumer 를 이용해 SSE 스트림을 구현한다.
클라이언트는 EventSource API 로 연결하며, 서버는 text/event-stream 형식으로 이벤트를 push 한다.

사용법 (일반)::

    from common.consumers import SseConsumer

    class StatusSseConsumer(SseConsumer):
        async def stream(self) -> None:
            await self.send_event({"status": "ok"})

사용법 (사용자 전용)::

    from common.consumers import UserSseConsumer

    class NotificationSseConsumer(UserSseConsumer):
        async def stream(self) -> None:
            await self.send_event({"type": "connected"}, event="connected")
            while not self.disconnected:
                msg = await self.channel_layer.receive(self.channel_name)
                await self.send_event(msg.get("payload", {}))

    # 외부(Celery task 등)에서 특정 사용자에게 push:
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    async_to_sync(get_channel_layer().group_send)(
        f"user_{user_id}",
        {"type": "sse.push", "payload": {"text": "알림 도착"}},
    )
"""

from __future__ import annotations

import json

import structlog
from channels.generic.http import AsyncHttpConsumer

logger = structlog.get_logger(__name__)

_SSE_HEADERS = [
  (b"Content-Type", b"text/event-stream"),
  (b"Cache-Control", b"no-cache"),
  (b"X-Accel-Buffering", b"no"),  # nginx 버퍼링 비활성화
]


class SseConsumer(AsyncHttpConsumer):
  """프로젝트 공통 SSE consumer 베이스.

    서브클래스는 stream() 을 구현하여 이벤트를 전송한다.
    연결 종료 여부는 self.disconnected 로 확인한다.
    """

  disconnected: bool = False

  async def handle(self, body: bytes) -> None:
    await self.send_headers(headers=_SSE_HEADERS)
    logger.info("sse_connected", channel=self.channel_name)
    try:
      await self.stream()
    finally:
      self.disconnected = True
      logger.info("sse_disconnected", channel=self.channel_name)

  async def disconnect(self) -> None:
    self.disconnected = True

  async def send_event(
    self,
    data: dict | str,
    *,
    event: str = "",
    retry_ms: int = 0,
  ) -> None:
    """SSE 이벤트 한 건을 전송한다.

        Args:
            data:     전송할 데이터 (dict 이면 JSON 직렬화)
            event:    이벤트 타입 이름 (생략 시 'message')
            retry_ms: 클라이언트 재연결 대기 시간(ms), 0 이면 생략
        """
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    lines: list[str] = []
    if event:
      lines.append(f"event: {event}")
    if retry_ms:
      lines.append(f"retry: {retry_ms}")
    lines.append(f"data: {payload}")
    lines.append("\n")  # 이벤트 구분자 빈 줄
    await self.send_body("\n".join(lines).encode(), more_body=True)

  async def stream(self) -> None:
    """이벤트 스트림 구현. 서브클래스에서 오버라이드한다."""


class UserSseConsumer(SseConsumer):
  """인증된 특정 사용자 전용 SSE consumer 베이스.

    Authorization: Bearer 헤더의 JWT token 을 검증하고,
    해당 사용자의 개인 채널(user_{id})에 자동 등록한다.
    인증 실패 시 401 응답을 반환하고 연결을 종료한다.

    채널 레이어를 통해 외부(Celery task 등)에서 특정 사용자에게 이벤트를 push할 수 있다.

    그룹 이름 규칙: "user_{user_id}"
    """

  _user_group: str = ""

  async def handle(self, body: bytes) -> None:
    user = await self._authenticate()
    if user is None:
      await self.send_response(401, b"Unauthorized")
      return

    self.user = user
    self._user_group = f"user_{user.pk}"

    await self.channel_layer.group_add(self._user_group, self.channel_name)
    logger.info("sse_user_connected", channel=self.channel_name, user_id=user.pk)

    await self.send_headers(headers=_SSE_HEADERS)
    try:
      await self.stream()
    finally:
      self.disconnected = True
      await self.channel_layer.group_discard(self._user_group, self.channel_name)
      logger.info("sse_user_disconnected", channel=self.channel_name, user_id=user.pk)

  # ── 사용자 재조회 ─────────────────────────────────────────────────────────

  async def get_fresh_user(self):
    """DB에서 사용자를 재조회해 최신 상태를 반환한다.

        self.user 는 연결 시점의 스냅샷이므로, 권한 체크나 중요한 데이터 처리 시
        이 메서드로 최신 상태를 확인한다. 계정이 비활성화됐으면 None 을 반환한다.

        사용 예::

            async def stream(self) -> None:
                user = await self.get_fresh_user()
                if user is None:
                    return  # 연결 종료
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
    """Authorization 헤더의 JWT token 을 검증한다.

        검증 실패 시 None 을 반환한다.

        헤더 방식:  Authorization: Bearer <access_token>

        브라우저 EventSource API 는 커스텀 헤더를 지원하지 않으므로
        fetch() + ReadableStream 방식을 사용하거나 테스터 UI 를 통해 연결한다.
        """
    from django.contrib.auth import get_user_model
    from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
    from rest_framework_simplejwt.tokens import AccessToken

    User = get_user_model()

    token_str = self._extract_token()
    if not token_str:
      logger.warning("sse_auth_missing_token")
      return None

    try:
      token = AccessToken(token_str)
      user_id = token["user_id"]
      return await User.objects.aget(pk=user_id, is_active=True)
    except (TokenError, InvalidToken, User.DoesNotExist):
      logger.warning("sse_auth_failed", token_prefix=token_str[:10])
      return None

  def _extract_token(self) -> str:
    """Authorization: Bearer 헤더에서 JWT token 을 추출한다."""
    headers = dict(self.scope.get("headers", []))
    auth_header = headers.get(b"authorization", b"").decode()
    if auth_header.startswith("Bearer "):
      return auth_header[len("Bearer "):]
    return ""
