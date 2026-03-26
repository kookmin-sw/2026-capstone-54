import secrets

import structlog
from common.views import BaseAPIView
from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response

from .serializers import WsTicketResponseSerializer

logger = structlog.get_logger(__name__)

_TICKET_TTL = 60  # seconds
_TICKET_PREFIX = "ws_ticket:"


@extend_schema(tags=["Realtime"])
class WsTicketAPIView(BaseAPIView):
  """WebSocket 연결용 단기 티켓 발급.

    인증된 사용자에게 60초짜리 1회용 티켓을 발급한다.
    발급된 티켓은 WebSocket 연결 시 쿼리스트링 ``?ticket=<ticket>`` 으로 전달한다.
    티켓은 연결 수립 즉시 삭제되어 재사용이 불가능하다.
    """

  @extend_schema(
    summary="WebSocket 티켓 발급",
    responses={200: WsTicketResponseSerializer},
  )
  def post(self, request):
    ticket = secrets.token_urlsafe(32)
    cache_key = f"{_TICKET_PREFIX}{ticket}"
    cache.set(cache_key, request.user.pk, timeout=_TICKET_TTL)
    logger.info("ws_ticket_issued", user_id=request.user.pk)
    return Response({"ticket": ticket})
