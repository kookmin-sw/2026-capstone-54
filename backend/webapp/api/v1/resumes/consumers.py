"""
이력서 분석 상태 SSE consumer.

특정 이력서의 분석 진행 상태를 실시간으로 push합니다.
DB polling 방식으로 상태 변경을 감지하며,
READ COMMITTED 격리 수준에서 커밋된 최신 값을 읽습니다.
"""

from __future__ import annotations

import asyncio

from channels.db import database_sync_to_async
from common.consumers.sse import UserSseConsumer
from django.db import connection
from realtime_docs.decorators import sse_consumer
from resumes.models import Resume


@sse_consumer(
  path="/sse/resumes/<resume_uuid>/analysis-status/",
  title="이력서 분석 상태 SSE",
  description="특정 이력서의 분석 진행 상태를 실시간으로 push합니다. JWT 인증 필요.",
  tags=["resumes"],
  events=[
    {
      "name": "status",
      "schema": {
        "type": "object",
        "properties": {
          "analysis_status": {
            "type": "string"
          },
          "analysis_step": {
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
class ResumeAnalysisStatusConsumer(UserSseConsumer):
  """이력서 분석 상태를 polling하여 변경 시 SSE로 push합니다."""

  POLL_INTERVAL = 1.5  # 초

  async def stream(self) -> None:
    resume_uuid = self.scope["url_route"]["kwargs"]["resume_uuid"]

    resume = await self._get_resume(resume_uuid)
    if resume is None:
      await self.send_event({"message": "이력서를 찾을 수 없습니다."}, event="error")
      return

    # 소유권 확인
    if resume.user_id != self.user.pk:
      await self.send_event({"message": "접근 권한이 없습니다."}, event="error")
      return

    # 초기 상태 전송
    last_status = resume.analysis_status
    last_step = resume.analysis_step
    await self._send_status(resume)

    # 이미 완료/실패 상태면 바로 종료
    if last_status in ("completed", "failed"):
      return

    # polling loop
    while not self.disconnected:
      await asyncio.sleep(self.POLL_INTERVAL)

      resume = await self._get_resume_fresh(resume.pk)
      if resume is None:
        break

      current_status = resume.analysis_status
      current_step = resume.analysis_step

      # 상태가 변경되었을 때만 이벤트 전송
      if current_status != last_status or current_step != last_step:
        await self._send_status(resume)
        last_status = current_status
        last_step = current_step

        # 완료/실패 시 스트림 종료
        if current_status in ("completed", "failed"):
          break

  async def _send_status(self, resume: Resume) -> None:
    updated_at = resume.updated_at.isoformat() if resume.updated_at else None
    await self.send_event(
      {
        "analysis_status": resume.analysis_status,
        "analysis_step": resume.analysis_step,
        "updated_at": updated_at,
      },
      event="status",
    )

  @database_sync_to_async
  def _get_resume(self, resume_uuid: str) -> Resume | None:
    """UUID(PK)로 이력서를 조회합니다. soft delete된 것은 제외."""
    try:
      return Resume.objects.get(pk=resume_uuid, deleted_at__isnull=True)
    except Resume.DoesNotExist:
      return None

  @database_sync_to_async
  def _get_resume_fresh(self, resume_pk) -> Resume | None:
    """PK(UUID)로 이력서를 재조회합니다. autocommit 모드에서 최신 커밋 값을 읽습니다."""
    connection.ensure_connection()
    if connection.in_atomic_block:
      connection.set_autocommit(True)
    try:
      return Resume.objects.get(pk=resume_pk, deleted_at__isnull=True)
    except Resume.DoesNotExist:
      return None
