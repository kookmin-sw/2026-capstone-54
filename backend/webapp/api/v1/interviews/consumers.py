"""면접 WebSocket Consumer — 세션 이탈 추적."""

import structlog
from common.consumers.websocket import UserWebSocketConsumer
from interviews.enums.session_status import InterviewSessionStatus

logger = structlog.get_logger(__name__)


class InterviewAbandonmentConsumer(UserWebSocketConsumer):
  """면접 세션 이탈 추적 WebSocket Consumer.

    클라이언트가 연결하면 세션 그룹에 참가하고,
    연결이 끊어지면 세션이 아직 진행 중인 경우 ABANDONED로 표시한다.

    URL: ws://host/ws/interviews/{session_uuid}/?ticket=<ticket>
    """

  _session = None

  async def handle_connect(self) -> None:
    session_uuid = self.scope["url_route"]["kwargs"]["session_uuid"]
    self._session = await self._get_session(session_uuid)

    if self._session is None:
      logger.warning(
        "interview_ws_session_not_found",
        session_uuid=session_uuid,
        user_id=self.user.pk,
      )
      await self.close(code=4004)
      return

    logger.info(
      "interview_ws_connected",
      session_uuid=session_uuid,
      user_id=self.user.pk,
    )

  async def handle_disconnect(self, code: int) -> None:
    if self._session is None:
      return

    is_abandoned = await self._mark_abandoned_if_in_progress()
    if is_abandoned:
      logger.info(
        "interview_session_abandoned",
        session_uuid=str(self._session.pk),
        user_id=self.user.pk,
        code=code,
      )

  async def _get_session(self, session_uuid: str):
    from interviews.models.interview_session import InterviewSession

    try:
      return await InterviewSession.objects.aget(
        pk=session_uuid,
        user=self.user,
      )
    except (InterviewSession.DoesNotExist, Exception):
      return None

  async def _mark_abandoned_if_in_progress(self) -> bool:
    from interviews.models.interview_session import InterviewSession

    updated = await InterviewSession.objects.filter(
      pk=self._session.pk,
      session_status=InterviewSessionStatus.IN_PROGRESS,
    ).aupdate(session_status=InterviewSessionStatus.ABANDONED)
    return updated > 0
