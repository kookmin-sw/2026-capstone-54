"""
UserJobDescriptionScrapingStatusConsumer 테스트.

stream() 메서드를 직접 호출하여 각 시나리오의 이벤트 전송 동작을 검증합니다.
DB 접근 메서드(_get_user_job_description, _get_user_job_description_fresh)는
모두 mock으로 대체하여 비동기 DB 스레딩 이슈를 피하고 로직에만 집중합니다.
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from django.test import TestCase
from users.factories import UserFactory


class UserJobDescriptionScrapingStatusConsumerTest(TestCase):
  """채용공고 스크래핑 상태 SSE consumer 테스트."""

  def setUp(self):
    """테스트에서 공유할 유저 픽스처를 생성합니다."""
    self.user = UserFactory()
    self.other_user = UserFactory()

  # ── 헬퍼 ──────────────────────────────────────────────────────────────────

  def _build_consumer(self, user, ujd_uuid: str):
    """테스트용 consumer 인스턴스를 빌드합니다.

        실제 HTTP 연결 없이 stream()만 테스트할 수 있도록
        scope, user, send_event를 최소 셋업합니다.
        """
    from api.v1.job_descriptions.consumers import (
      UserJobDescriptionScrapingStatusConsumer,
    )

    consumer = UserJobDescriptionScrapingStatusConsumer()
    consumer.scope = {"url_route": {"kwargs": {"user_job_description_uuid": str(ujd_uuid)}}}
    consumer.user = user
    consumer.disconnected = False
    consumer.send_event = AsyncMock()
    return consumer

  @staticmethod
  def _make_ujd_mock(collection_status: str, user_id=None) -> MagicMock:
    """지정된 collection_status를 가진 UserJobDescription mock을 반환합니다."""
    jd_mock = MagicMock()
    jd_mock.collection_status = collection_status
    jd_mock.updated_at = None

    ujd_mock = MagicMock()
    ujd_mock.job_description = jd_mock
    if user_id is not None:
      ujd_mock.user_id = user_id
    return ujd_mock

  # ── 테스트 케이스 ──────────────────────────────────────────────────────────

  async def test_not_found(self):
    """존재하지 않는 UUID 조회 시 error 이벤트를 1건 전송하고 종료합니다."""
    consumer = self._build_consumer(self.user, uuid.uuid4())

    with patch.object(
      consumer,
      "_get_user_job_description",
      new=AsyncMock(return_value=None),
    ):
      await consumer.stream()

    consumer.send_event.assert_called_once_with(
      {"message": "채용공고를 찾을 수 없습니다."},
      event="error",
    )

  async def test_unauthorized(self):
    """다른 유저 소유의 채용공고 접근 시 error 이벤트를 1건 전송하고 종료합니다."""
    ujd_mock = self._make_ujd_mock("pending", user_id=self.other_user.pk)
    consumer = self._build_consumer(self.user, uuid.uuid4())

    with patch.object(
      consumer,
      "_get_user_job_description",
      new=AsyncMock(return_value=ujd_mock),
    ):
      await consumer.stream()

    consumer.send_event.assert_called_once_with(
      {"message": "접근 권한이 없습니다."},
      event="error",
    )

  async def test_already_terminal_done(self):
    """초기 status가 done이면 status 이벤트 1건만 전송하고 즉시 종료합니다."""
    ujd_mock = self._make_ujd_mock("done", user_id=self.user.pk)
    consumer = self._build_consumer(self.user, uuid.uuid4())

    with patch.object(
      consumer,
      "_get_user_job_description",
      new=AsyncMock(return_value=ujd_mock),
    ):
      await consumer.stream()

    consumer.send_event.assert_called_once()
    data, kwargs = consumer.send_event.call_args
    self.assertEqual(kwargs["event"], "status")
    self.assertEqual(data[0]["collection_status"], "done")

  async def test_already_terminal_error(self):
    """초기 status가 error이면 status 이벤트 1건만 전송하고 즉시 종료합니다."""
    ujd_mock = self._make_ujd_mock("error", user_id=self.user.pk)
    consumer = self._build_consumer(self.user, uuid.uuid4())

    with patch.object(
      consumer,
      "_get_user_job_description",
      new=AsyncMock(return_value=ujd_mock),
    ):
      await consumer.stream()

    consumer.send_event.assert_called_once()
    data, kwargs = consumer.send_event.call_args
    self.assertEqual(kwargs["event"], "status")
    self.assertEqual(data[0]["collection_status"], "error")

  async def test_status_change(self):
    """pending → in_progress → done 상태 변경 시 각 상태마다 status 이벤트를 전송합니다."""
    initial_ujd = self._make_ujd_mock("pending", user_id=self.user.pk)
    ujd_in_progress = self._make_ujd_mock("in_progress")
    ujd_done = self._make_ujd_mock("done")
    consumer = self._build_consumer(self.user, uuid.uuid4())

    with (
      patch.object(
        consumer,
        "_get_user_job_description",
        new=AsyncMock(return_value=initial_ujd),
      ),
      patch.object(
        consumer,
        "_get_user_job_description_fresh",
        new=AsyncMock(side_effect=[ujd_in_progress, ujd_done]),
      ),
      patch("api.v1.job_descriptions.consumers.asyncio.sleep", new=AsyncMock()),
    ):
      await consumer.stream()

    # 초기 pending + in_progress + done = 총 3회
    self.assertEqual(consumer.send_event.call_count, 3)
    sent_statuses = [call[0][0]["collection_status"] for call in consumer.send_event.call_args_list]
    self.assertEqual(sent_statuses, ["pending", "in_progress", "done"])
    sent_events = [call[1]["event"] for call in consumer.send_event.call_args_list]
    self.assertEqual(sent_events, ["status", "status", "status"])

  async def test_no_duplicate_event(self):
    """동일 상태가 반복될 때 중복 이벤트를 전송하지 않습니다."""
    initial_ujd = self._make_ujd_mock("pending", user_id=self.user.pk)
    ujd_same_1 = self._make_ujd_mock("pending")
    ujd_same_2 = self._make_ujd_mock("pending")
    ujd_done = self._make_ujd_mock("done")
    consumer = self._build_consumer(self.user, uuid.uuid4())

    with (
      patch.object(
        consumer,
        "_get_user_job_description",
        new=AsyncMock(return_value=initial_ujd),
      ),
      patch.object(
        consumer,
        "_get_user_job_description_fresh",
        # pending 두 번 반복 후 done으로 변경
        new=AsyncMock(side_effect=[ujd_same_1, ujd_same_2, ujd_done]),
      ),
      patch("api.v1.job_descriptions.consumers.asyncio.sleep", new=AsyncMock()),
    ):
      await consumer.stream()

    # 초기 pending + done = 총 2회 (중복 pending 2번은 전송 안 함)
    self.assertEqual(consumer.send_event.call_count, 2)
    sent_statuses = [call[0][0]["collection_status"] for call in consumer.send_event.call_args_list]
    self.assertEqual(sent_statuses, ["pending", "done"])
