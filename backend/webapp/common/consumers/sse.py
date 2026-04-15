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
            # 연결 유지 (heartbeat)
            # 실제 메시지는 sse_push() 핸들러를 통해 group_send로 수신한다
            while not self.disconnected:
                await asyncio.sleep(30)
                await self.send_event("", event="heartbeat")

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
from channels.exceptions import StopConsumer
from channels.generic.http import AsyncHttpConsumer
from django.conf import settings

logger = structlog.get_logger(__name__)

_SSE_HEADERS = [
  (b"Content-Type", b"text/event-stream"),
  (b"Cache-Control", b"no-cache"),
  (b"X-Accel-Buffering", b"no"),  # nginx 버퍼링 비활성화
]


def _resolve_cors_origin(scope: dict) -> bytes | None:
  """요청의 Origin 헤더를 settings.CORS_ALLOWED_ORIGINS 와 매칭해 허용 가능한 origin 을 반환.

    Channels HTTP consumer 는 Django middleware 스택을 거치지 않으므로 django-cors-headers 가
    적용되지 않는다. 이 헬퍼는 SseConsumer 가 직접 CORS 헤더를 셋업할 때 사용된다.
    """
  headers = dict(scope.get("headers", []))
  origin = headers.get(b"origin")
  if not origin:
    return None
  allow_all = getattr(settings, "CORS_ALLOW_ALL_ORIGINS", False)
  if allow_all:
    return origin
  allowed = getattr(settings, "CORS_ALLOWED_ORIGINS", []) or []
  origin_str = origin.decode("ascii", errors="ignore")
  if origin_str in allowed:
    return origin
  return None


def _build_cors_headers(origin: bytes | None) -> list[tuple[bytes, bytes]]:
  """CORS 응답 헤더 목록. origin 이 None 이면 빈 리스트를 반환."""
  if origin is None:
    return []
  headers: list[tuple[bytes, bytes]] = [
    (b"Access-Control-Allow-Origin", origin),
    (b"Vary", b"Origin"),
  ]
  if getattr(settings, "CORS_ALLOW_CREDENTIALS", False):
    headers.append((b"Access-Control-Allow-Credentials", b"true"))
  return headers


class SseConsumer(AsyncHttpConsumer):
  """프로젝트 공통 SSE consumer 베이스.

    서브클래스는 stream() 을 구현하여 이벤트를 전송한다.
    연결 종료 여부는 self.disconnected 로 확인한다.
    """

  disconnected: bool = False

  async def http_request(self, message: dict) -> None:
    """OPTIONS preflight 는 인증 없이 즉시 CORS 응답을 반환한다.

        Channels HTTP consumer 는 Django middleware (django-cors-headers 포함) 를 거치지 않으므로,
        SSE 라우트는 직접 preflight 를 처리해야 한다. GET 등 그 외 메서드는 부모 구현으로 위임한다.
        """
    if self.scope.get("method") == "OPTIONS":
      origin = _resolve_cors_origin(self.scope)
      headers = _build_cors_headers(origin) + [
        (b"Access-Control-Allow-Methods", b"GET, OPTIONS"),
        (
          b"Access-Control-Allow-Headers",
          b"authorization, content-type, accept, cache-control, x-requested-with, x-csrftoken"
        ),
        (b"Access-Control-Max-Age", b"86400"),
        (b"Content-Length", b"0"),
      ]
      await self.send_response(204, b"", headers=headers)
      raise StopConsumer()
    await super().http_request(message)

  async def handle(self, body: bytes) -> None:
    cors = _build_cors_headers(_resolve_cors_origin(self.scope))
    await self.send_headers(headers=_SSE_HEADERS + cors)
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
    해당 사용자의 개인 그룹(user_{id})에 자동 등록한다.
    인증 실패 시 401 응답을 반환하고 연결을 종료한다.

    채널 레이어를 통해 외부(Celery task 등)에서 특정 사용자에게 이벤트를 push할 수 있다.

    그룹 이름 규칙: "user_{user_id}"
    메시지 type 규칙: "sse.push" (Channels는 type의 '.'을 '_'로 변환해 메서드를 호출한다)
    """

  _user_group: str = ""

  async def handle(self, body: bytes) -> None:
    cors = _build_cors_headers(_resolve_cors_origin(self.scope))

    user = await self._authenticate()
    if user is None:
      await self.send_response(401, b"Unauthorized", headers=cors)
      return

    self.user = user
    self._user_group = f"user_{user.pk}"

    await self.channel_layer.group_add(self._user_group, self.channel_name)
    logger.info("sse_user_connected", channel=self.channel_name, user_id=user.pk)

    await self.send_headers(headers=_SSE_HEADERS + cors)
    try:
      await self.stream()
    finally:
      self.disconnected = True
      await self.channel_layer.group_discard(self._user_group, self.channel_name)
      logger.info("sse_user_disconnected", channel=self.channel_name, user_id=user.pk)

  # ── 채널 레이어 메시지 핸들러 ────────────────────────────────────────────
  # group_send({"type": "sse.push", "payload": {...}}) 호출 시 실행된다.

  async def sse_push(self, event: dict) -> None:
    """채널 레이어에서 수신한 'sse.push' 타입의 메시지를 클라이언트로 전달합니다."""
    await self.send_event(event.get("payload", {}))

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
