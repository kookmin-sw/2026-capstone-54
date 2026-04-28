"""면접 WebSocket / SSE Consumer."""

from __future__ import annotations

import asyncio

import structlog
from channels.db import database_sync_to_async
from common.consumers.sse import UserSseConsumer
from common.consumers.websocket import UserWebSocketConsumer
from django.core.cache import cache
from django.utils import timezone
from realtime_docs.decorators import sse_consumer

logger = structlog.get_logger(__name__)

CONN_SEQ_TTL_SECONDS = 86400
WS_CLOSE_EVICTED = 4409
WS_CLOSE_SESSION_NOT_FOUND = 4004


class InterviewSessionConsumer(UserWebSocketConsumer):
  """면접 세션 WebSocket Consumer.

    동일 세션의 다른 connection 을 fencing token (owner_version, conn_seq) 비교로 evict 한다.
    URL: ws://host/ws/interviews/{session_uuid}/?ticket=<ticket>
    """

  _session = None
  _session_group: str = ""
  _conn_seq: int = 0
  _owner_version: int = 0

  async def handle_connect(self) -> None:
    session_uuid = self.scope["url_route"]["kwargs"]["session_uuid"]
    self._session = await self._get_session(session_uuid)

    if self._session is None:
      logger.warning(
        "interview_ws_session_not_found",
        session_uuid=session_uuid,
        user_id=self.user.pk,
      )
      await self.close(code=WS_CLOSE_SESSION_NOT_FOUND)
      return

    self._session_group = f"interview_session_{session_uuid}"
    self._conn_seq = await self._issue_conn_seq(session_uuid)
    self._owner_version = self._session.owner_version

    await self.channel_layer.group_send(
      self._session_group,
      {
        "type": "session.evict",
        "payload": {
          "owner_version": self._owner_version,
          "winner_seq": self._conn_seq,
          "winner_channel": self.channel_name,
          "issued_at": timezone.now().isoformat(),
        },
      },
    )

    await self.channel_layer.group_add(self._session_group, self.channel_name)

    if await self._is_stale_after_join(session_uuid):
      logger.info(
        "interview_ws_self_evicted",
        session_uuid=session_uuid,
        user_id=self.user.pk,
        conn_seq=self._conn_seq,
      )
      await self.close(code=WS_CLOSE_EVICTED)
      return

    logger.info(
      "interview_ws_connected",
      session_uuid=session_uuid,
      user_id=self.user.pk,
      conn_seq=self._conn_seq,
      owner_version=self._owner_version,
    )

  async def handle_disconnect(self, code: int) -> None:
    if self._session is None:
      return

    if self._session_group:
      await self.channel_layer.group_discard(self._session_group, self.channel_name)

    logger.info(
      "interview_ws_disconnected",
      session_uuid=str(self._session.pk),
      user_id=self.user.pk,
      code=code,
      conn_seq=self._conn_seq,
    )

  async def session_evict(self, event: dict) -> None:
    """다른 connection 발급 시 group_send 로 도달하는 evict 신호를 처리한다."""
    payload = event.get("payload", {})
    incoming_owner_version = int(payload.get("owner_version", 0))
    incoming_seq = int(payload.get("winner_seq", 0))
    if (self._owner_version, self._conn_seq) < (incoming_owner_version, incoming_seq):
      await self.close(code=WS_CLOSE_EVICTED)

  async def _issue_conn_seq(self, session_uuid: str) -> int:
    cache_key = f"session_conn_seq:{session_uuid}"
    await cache.aadd(cache_key, 0, timeout=CONN_SEQ_TTL_SECONDS)
    try:
      return int(await cache.aincr(cache_key))
    except ValueError:
      await cache.aset(cache_key, 1, timeout=CONN_SEQ_TTL_SECONDS)
      return 1

  async def _is_stale_after_join(self, session_uuid: str) -> bool:
    current_seq = await cache.aget(f"session_conn_seq:{session_uuid}")
    if current_seq is None:
      return False
    return int(current_seq) > self._conn_seq

  async def _get_session(self, session_uuid: str):
    from interviews.models.interview_session import InterviewSession

    try:
      return await InterviewSession.objects.aget(
        pk=session_uuid,
        user=self.user,
      )
    except (InterviewSession.DoesNotExist, Exception):
      return None


@sse_consumer(
  path="/sse/interviews/<interview_session_uuid>/report-status/",
  title="면접 리포트 생성 상태 SSE",
  description="면접 분석 리포트 생성 진행 상태를 실시간으로 push합니다. JWT 인증 필요.",
  tags=["interviews"],
  events=[
    {
      "name": "status",
      "schema": {
        "type": "object",
        "properties": {
          "interview_analysis_report_status": {
            "type": "string"
          },
          "updated_at": {
            "type": "string",
            "format": "date-time"
          },
        },
      },
    },
    {
      "name": "error",
      "schema": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
        },
      },
    },
  ],
)
class InterviewReportStatusConsumer(UserSseConsumer):
  """면접 분석 리포트 상태를 polling하여 변경 시 SSE로 push합니다."""

  POLL_INTERVAL = 2.0  # 초

  async def stream(self) -> None:
    interview_session_uuid = self.scope["url_route"]["kwargs"]["interview_session_uuid"]

    session = await self._get_session(interview_session_uuid)
    if session is None:
      await self.send_event({"message": "면접 세션을 찾을 수 없습니다."}, event="error")
      return

    if session.user_id != self.user.pk:
      await self.send_event({"message": "접근 권한이 없습니다."}, event="error")
      return

    report = await self._get_report(session.pk)
    if report is None:
      await self.send_event({"message": "리포트를 찾을 수 없습니다."}, event="error")
      return

    last_status = report.interview_analysis_report_status
    await self._send_status(report)

    if last_status in ("completed", "failed"):
      return

    while not self.disconnected:
      await asyncio.sleep(self.POLL_INTERVAL)

      report = await self._get_report_fresh(report.pk)
      if report is None:
        break

      current_status = report.interview_analysis_report_status
      if current_status != last_status:
        await self._send_status(report)
        last_status = current_status
        if current_status in ("completed", "failed"):
          break

  async def _send_status(self, report) -> None:
    updated_at = report.updated_at.isoformat() if report.updated_at else None
    await self.send_event(
      {
        "interview_analysis_report_status": report.interview_analysis_report_status,
        "updated_at": updated_at,
      },
      event="status",
    )

  @database_sync_to_async
  def _get_session(self, session_uuid: str):
    from interviews.models.interview_session import InterviewSession
    try:
      return InterviewSession.objects.get(pk=session_uuid)
    except InterviewSession.DoesNotExist:
      return None

  @database_sync_to_async
  def _get_report(self, session_pk):
    from interviews.models.interview_analysis_report import InterviewAnalysisReport
    try:
      return InterviewAnalysisReport.objects.get(interview_session_id=session_pk)
    except InterviewAnalysisReport.DoesNotExist:
      return None

  @database_sync_to_async
  def _get_report_fresh(self, report_pk: int):
    from django.db import connection
    from interviews.models.interview_analysis_report import InterviewAnalysisReport
    connection.ensure_connection()
    if connection.in_atomic_block:
      connection.set_autocommit(True)
    try:
      return InterviewAnalysisReport.objects.get(pk=report_pk)
    except InterviewAnalysisReport.DoesNotExist:
      return None
