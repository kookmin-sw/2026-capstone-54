"""InterviewSessionConsumer eviction + fencing token 테스트."""

from unittest.mock import AsyncMock, MagicMock, patch

from api.v1.interviews.consumers import InterviewSessionConsumer
from django.core.cache import cache
from django.test import TestCase, override_settings
from interviews.factories import InterviewSessionFactory
from users.factories import UserFactory


@override_settings(
  CACHES={
    "default": {
      "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
      "LOCATION": "test-interview-session-consumer",
    }
  }
)
class InterviewSessionConsumerTests(TestCase):
  """handle_connect / session_evict / handle_disconnect 동작 검증."""

  def setUp(self):
    cache.clear()
    self.user = UserFactory()
    self.session = InterviewSessionFactory(user=self.user)

  def tearDown(self):
    cache.clear()

  def _build_consumer(self, channel_name: str = "test-channel-1") -> InterviewSessionConsumer:
    consumer = InterviewSessionConsumer()
    consumer.scope = {"url_route": {"kwargs": {"session_uuid": str(self.session.pk)}}}
    consumer.user = self.user
    consumer.channel_name = channel_name
    consumer.channel_layer = MagicMock()
    consumer.channel_layer.group_add = AsyncMock()
    consumer.channel_layer.group_discard = AsyncMock()
    consumer.channel_layer.group_send = AsyncMock()
    consumer.close = AsyncMock()
    return consumer

  async def test_close_4004_when_session_not_found(self):
    """세션이 없으면 4004 로 close 한다."""
    consumer = self._build_consumer()

    with patch.object(consumer, "_get_session", new=AsyncMock(return_value=None)):
      await consumer.handle_connect()

    consumer.close.assert_called_once_with(code=4004)

  async def test_broadcasts_eviction_before_group_add(self):
    """group_add 호출 전에 eviction 메시지를 broadcast 한다."""
    consumer = self._build_consumer()
    call_log: list[str] = []
    consumer.channel_layer.group_send = AsyncMock(side_effect=lambda *args, **kwargs: call_log.append("send"))
    consumer.channel_layer.group_add = AsyncMock(side_effect=lambda *args, **kwargs: call_log.append("add"))

    with patch.object(consumer, "_get_session", new=AsyncMock(return_value=self.session)):
      await consumer.handle_connect()

    self.assertEqual(call_log[:2], ["send", "add"])

  async def test_eviction_payload_contains_required_fields(self):
    """eviction payload 에 owner_version, winner_seq, winner_channel, issued_at 이 포함된다."""
    consumer = self._build_consumer()

    with patch.object(consumer, "_get_session", new=AsyncMock(return_value=self.session)):
      await consumer.handle_connect()

    args, _ = consumer.channel_layer.group_send.call_args
    self.assertEqual(args[0], f"interview_session_{self.session.pk}")
    self.assertEqual(args[1]["type"], "session.evict")
    payload = args[1]["payload"]
    self.assertIn("owner_version", payload)
    self.assertIn("winner_seq", payload)
    self.assertIn("winner_channel", payload)
    self.assertIn("issued_at", payload)
    self.assertEqual(payload["winner_channel"], "test-channel-1")

  async def test_joins_session_group_after_eviction_broadcast(self):
    """group_add 가 interview_session_{uuid} 그룹에 self.channel_name 으로 호출된다."""
    consumer = self._build_consumer()

    with patch.object(consumer, "_get_session", new=AsyncMock(return_value=self.session)):
      await consumer.handle_connect()

    consumer.channel_layer.group_add.assert_called_once_with(
      f"interview_session_{self.session.pk}",
      "test-channel-1",
    )

  async def test_issues_monotonically_increasing_conn_seq(self):
    """동일 세션에 연속 connect 시 conn_seq 가 증가한다."""
    consumer1 = self._build_consumer(channel_name="ch-1")
    with patch.object(consumer1, "_get_session", new=AsyncMock(return_value=self.session)):
      await consumer1.handle_connect()

    consumer2 = self._build_consumer(channel_name="ch-2")
    with patch.object(consumer2, "_get_session", new=AsyncMock(return_value=self.session)):
      await consumer2.handle_connect()

    self.assertGreater(consumer2._conn_seq, consumer1._conn_seq)

  async def test_session_evict_closes_when_owner_version_higher(self):
    """수신한 owner_version 이 자신보다 크면 close(4409)."""
    consumer = self._build_consumer()
    consumer._owner_version = 1
    consumer._conn_seq = 5

    await consumer.session_evict({"payload": {"owner_version": 2, "winner_seq": 0}})

    consumer.close.assert_called_once_with(code=4409)

  async def test_session_evict_closes_when_seq_higher_at_same_owner_version(self):
    """동일 owner_version 에서 winner_seq 가 자신보다 크면 close(4409)."""
    consumer = self._build_consumer()
    consumer._owner_version = 1
    consumer._conn_seq = 5

    await consumer.session_evict({"payload": {"owner_version": 1, "winner_seq": 6}})

    consumer.close.assert_called_once_with(code=4409)

  async def test_session_evict_ignores_lower_seq(self):
    """수신한 fencing token 이 자신보다 작거나 같으면 close 하지 않는다."""
    consumer = self._build_consumer()
    consumer._owner_version = 1
    consumer._conn_seq = 5

    await consumer.session_evict({"payload": {"owner_version": 1, "winner_seq": 3}})
    await consumer.session_evict({"payload": {"owner_version": 1, "winner_seq": 5}})

    consumer.close.assert_not_called()

  async def test_session_evict_ignores_lower_owner_version(self):
    """수신한 owner_version 이 자신보다 작으면 close 하지 않는다."""
    consumer = self._build_consumer()
    consumer._owner_version = 5
    consumer._conn_seq = 1

    await consumer.session_evict({"payload": {"owner_version": 4, "winner_seq": 999}})

    consumer.close.assert_not_called()

  async def test_handle_disconnect_discards_session_group(self):
    """session group 에서 group_discard 한다."""
    consumer = self._build_consumer()
    consumer._session = self.session
    consumer._session_group = f"interview_session_{self.session.pk}"

    await consumer.handle_disconnect(1000)

    consumer.channel_layer.group_discard.assert_called_once_with(
      f"interview_session_{self.session.pk}",
      "test-channel-1",
    )

  async def test_handle_disconnect_noop_when_no_session(self):
    """session 이 None 이면 group_discard 호출하지 않는다."""
    consumer = self._build_consumer()
    consumer._session = None

    await consumer.handle_disconnect(1000)

    consumer.channel_layer.group_discard.assert_not_called()

  async def test_self_evicts_when_newer_seq_appears_after_join(self):
    """group_add 직후 자신보다 큰 seq 가 발급되어 있으면 즉시 self-evict (4409)."""
    consumer = self._build_consumer()

    async def _bump_seq_after_join(*args, **kwargs):
      cache_key = f"session_conn_seq:{self.session.pk}"
      await cache.aincr(cache_key)

    consumer.channel_layer.group_add = AsyncMock(side_effect=_bump_seq_after_join)

    with patch.object(consumer, "_get_session", new=AsyncMock(return_value=self.session)):
      await consumer.handle_connect()

    consumer.close.assert_called_once_with(code=4409)

  async def test_handle_message_pause_invokes_pause_service_and_acks(self):
    """pause 메시지는 PauseInterviewSessionService 호출 후 pause_ack 를 reply 한다."""
    consumer = self._build_consumer()
    consumer._session = self.session
    consumer.reply = AsyncMock()
    consumer._invoke_pause_service = AsyncMock()

    await consumer.handle_message({"type": "pause", "reason": "user_left_window"})

    consumer._invoke_pause_service.assert_awaited_once_with("user_left_window")
    consumer.reply.assert_awaited_with({"type": "pause_ack", "reason": "user_left_window"})

  async def test_handle_message_resume_invokes_resume_service_and_acks(self):
    """resume 메시지는 ResumeInterviewSessionService 호출 후 resume_ack 를 reply 한다."""
    consumer = self._build_consumer()
    consumer._session = self.session
    consumer.reply = AsyncMock()
    consumer._invoke_resume_service = AsyncMock()

    await consumer.handle_message({"type": "resume"})

    consumer._invoke_resume_service.assert_awaited_once()
    consumer.reply.assert_awaited_with({"type": "resume_ack"})

  async def test_handle_message_heartbeat_invokes_heartbeat_service_and_acks(self):
    """heartbeat 메시지는 RecordInterviewHeartbeatService 호출 후 heartbeat_ack 를 reply 한다."""
    consumer = self._build_consumer()
    consumer._session = self.session
    consumer.reply = AsyncMock()
    consumer._invoke_heartbeat_service = AsyncMock()

    await consumer.handle_message({"type": "heartbeat"})

    consumer._invoke_heartbeat_service.assert_awaited_once()
    consumer.reply.assert_awaited_with({"type": "heartbeat_ack"})

  async def test_handle_message_unknown_type_replies_error(self):
    """알 수 없는 메시지 타입은 error reply 후 종료한다."""
    consumer = self._build_consumer()
    consumer._session = self.session
    consumer.reply = AsyncMock()

    await consumer.handle_message({"type": "frobnicate"})

    consumer.reply.assert_awaited_once()
    payload = consumer.reply.call_args[0][0]
    self.assertEqual(payload["type"], "error")

  async def test_handle_message_replies_error_when_session_not_initialized(self):
    """_session 이 None 이면 session_not_initialized error 를 reply 한다."""
    consumer = self._build_consumer()
    consumer._session = None
    consumer.reply = AsyncMock()

    await consumer.handle_message({"type": "pause", "reason": "any"})

    consumer.reply.assert_awaited_once_with({"type": "error", "error": "session_not_initialized"})

  async def test_handle_message_pause_service_failure_replies_error(self):
    """pause service 가 예외를 던지면 pause_error 를 reply 한다."""
    consumer = self._build_consumer()
    consumer._session = self.session
    consumer.reply = AsyncMock()
    consumer._invoke_pause_service = AsyncMock(side_effect=RuntimeError("pause failed"))

    await consumer.handle_message({"type": "pause", "reason": "any"})

    consumer.reply.assert_awaited_once()
    payload = consumer.reply.call_args[0][0]
    self.assertEqual(payload["type"], "pause_error")
