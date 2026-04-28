"""인터뷰 세션 owner 강제 인수(takeover) 서비스."""

import hashlib
import secrets

import structlog
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from common.exceptions import ConflictException
from common.services import BaseService
from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording, InterviewSession

from .claim_session_ownership_service import ClaimSessionOwnershipService
from .get_s3_client import get_video_s3_client

logger = structlog.get_logger(__name__)

WS_TICKET_TTL_SECONDS = 60


class TakeoverInterviewSessionService(BaseService):
  """기존 owner 를 무효화하고 새 owner 토큰 + ws_ticket 을 발급한다."""

  required_value_kwargs = ["session"]

  def validate(self):
    session = self.kwargs["session"]
    if self.user is None or session.user_id != self.user.pk:
      raise ConflictException(
        error_code="SESSION_OWNER_REQUIRED",
        detail="세션 소유자만 takeover 할 수 있습니다.",
      )

  def execute(self):
    session_uuid = self.kwargs["session"].uuid
    locked_session = InterviewSession.objects.select_for_update().get(pk=session_uuid)

    if locked_session.user_id != self.user.pk:
      raise ConflictException(
        error_code="SESSION_OWNER_REQUIRED",
        detail="세션 소유자만 takeover 할 수 있습니다.",
      )

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    locked_session.mark_owner_changed(token_hash=token_hash)

    owner_cache_key = f"interview_session_owner:{locked_session.uuid}"
    cache.set(owner_cache_key, token, timeout=ClaimSessionOwnershipService.OWNER_TTL_SECONDS)

    abandoned_recordings = self._abandon_active_recordings(locked_session)

    ws_ticket = secrets.token_urlsafe(32)
    cache.set(f"ws_ticket:{ws_ticket}", self.user.pk, timeout=WS_TICKET_TTL_SECONDS)

    new_owner_version = locked_session.owner_version
    transaction.on_commit(lambda: self._abort_recordings_in_s3(abandoned_recordings))
    transaction.on_commit(lambda: self._broadcast_eviction(session_uuid, new_owner_version))

    return {
      "owner_token": token,
      "owner_version": new_owner_version,
      "ws_ticket": ws_ticket,
    }

  @staticmethod
  def _abandon_active_recordings(session: InterviewSession) -> list[InterviewRecording]:
    recordings = list(
      InterviewRecording.objects.filter(
        interview_session=session,
        status__in=[RecordingStatus.INITIATED, RecordingStatus.UPLOADING],
      )
    )
    for recording in recordings:
      recording.status = RecordingStatus.ABANDONED
      recording.save(update_fields=["status"])
    return recordings

  @staticmethod
  def _abort_recordings_in_s3(recordings: list[InterviewRecording]) -> None:
    if not recordings:
      return
    s3 = get_video_s3_client()
    for recording in recordings:
      try:
        s3.abort_multipart_upload(
          Bucket=recording.s3_bucket,
          Key=recording.s3_key,
          UploadId=recording.upload_id,
        )
      except Exception:
        logger.warning(
          "takeover_recording_s3_abort_failed",
          recording_uuid=str(recording.pk),
          exc_info=True,
        )

  @staticmethod
  def _broadcast_eviction(session_uuid, owner_version: int) -> None:
    payload = {
      "owner_version": owner_version,
      "winner_seq": 0,
      "issued_at": timezone.now().isoformat(),
    }
    async_to_sync(get_channel_layer().group_send)(
      f"interview_session_{session_uuid}",
      {
        "type": "session.evict",
        "payload": payload,
      },
    )
