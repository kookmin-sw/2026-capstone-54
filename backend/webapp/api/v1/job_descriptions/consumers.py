"""
채용공고 스크래핑 상태 SSE consumer.

특정 사용자 채용공고(UserJobDescription)의 수집 진행 상태를
실시간으로 push합니다. DB polling 방식으로 상태 변경을 감지하며,
READ COMMITTED 격리 수준에서 커밋된 최신 값을 읽습니다.
"""

from __future__ import annotations

import asyncio

from channels.db import database_sync_to_async
from common.consumers.sse import UserSseConsumer
from django.db import connection
from job_descriptions.models import UserJobDescription
from realtime_docs.decorators import sse_consumer


@sse_consumer(
  path="/sse/user-job-descriptions/<user_job_description_uuid>/collection-status/",
  title="채용공고 스크래핑 상태 SSE",
  description="특정 사용자 채용공고의 스크래핑 진행 상태를 실시간으로 push합니다. JWT 인증 필요.",
  tags=["job_descriptions"],
  events=[
    {
      "name": "status",
      "schema": {
        "type": "object",
        "properties": {
          "collection_status": {
            "type": "string",
            "enum": ["pending", "in_progress", "done", "error"],
          },
          "updated_at": {
            "type": "string",
            "format": "date-time",
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
            "type": "string",
          },
        },
      },
    },
  ],
)
class UserJobDescriptionScrapingStatusConsumer(UserSseConsumer):
  """채용공고 스크래핑 상태를 polling하여 변경 시 SSE로 push합니다."""

  POLL_INTERVAL = 1.5  # 초
  TERMINAL_STATUSES = ("done", "error")

  async def stream(self) -> None:
    user_job_description_uuid = self.scope["url_route"]["kwargs"]["user_job_description_uuid"]

    user_job_description = await self._get_user_job_description(user_job_description_uuid)
    if user_job_description is None:
      await self.send_event({"message": "채용공고를 찾을 수 없습니다."}, event="error")
      return

    # 소유권 확인
    if user_job_description.user_id != self.user.pk:
      await self.send_event({"message": "접근 권한이 없습니다."}, event="error")
      return

    # 초기 상태 전송
    last_status = user_job_description.job_description.collection_status
    await self._send_status(user_job_description)

    # 이미 완료/실패 상태면 바로 종료
    if last_status in self.TERMINAL_STATUSES:
      return

    # polling loop
    while not self.disconnected:
      await asyncio.sleep(self.POLL_INTERVAL)

      user_job_description = await self._get_user_job_description_fresh(user_job_description.pk)
      if user_job_description is None:
        break

      current_status = user_job_description.job_description.collection_status

      # 상태가 변경되었을 때만 이벤트 전송
      if current_status != last_status:
        await self._send_status(user_job_description)
        last_status = current_status

        # 완료/실패 시 스트림 종료
        if current_status in self.TERMINAL_STATUSES:
          break

  async def _send_status(self, user_job_description: UserJobDescription) -> None:
    jd = user_job_description.job_description
    updated_at = jd.updated_at.isoformat() if jd.updated_at else None
    await self.send_event(
      {
        "collection_status": jd.collection_status,
        "updated_at": updated_at,
      },
      event="status",
    )

  @database_sync_to_async
  def _get_user_job_description(self, uuid: str) -> UserJobDescription | None:
    """UUID(PK)로 사용자 채용공고를 조회합니다."""
    try:
      return UserJobDescription.objects.select_related("job_description").get(pk=uuid)
    except UserJobDescription.DoesNotExist:
      return None

  @database_sync_to_async
  def _get_user_job_description_fresh(self, pk) -> UserJobDescription | None:
    """PK로 사용자 채용공고를 재조회합니다. autocommit 모드에서 최신 커밋 값을 읽습니다."""
    connection.ensure_connection()
    if connection.in_atomic_block:
      connection.set_autocommit(True)
    try:
      return UserJobDescription.objects.select_related("job_description").get(pk=pk)
    except UserJobDescription.DoesNotExist:
      return None
