"""인터뷰 세션 owner 토큰 발급 서비스."""

import hashlib
import secrets

from common.exceptions import ConflictException
from common.services import BaseService
from django.core.cache import cache


class ClaimSessionOwnershipService(BaseService):
  """인터뷰 세션의 owner 토큰을 발급하고 Redis + DB 에 동기화한다."""

  required_value_kwargs = ["session"]

  OWNER_TTL_SECONDS = 7200

  def validate(self):
    session = self.kwargs["session"]
    if self.user is None or session.user_id != self.user.pk:
      raise ConflictException(
        error_code="SESSION_OWNER_REQUIRED",
        detail="세션 소유자만 토큰을 발급할 수 있습니다.",
      )

  def execute(self):
    session = self.kwargs["session"]
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    cache_key = f"interview_session_owner:{session.uuid}"
    cache.set(cache_key, token, timeout=self.OWNER_TTL_SECONDS)

    session.mark_owner_changed(token_hash=token_hash)

    return {
      "owner_token": token,
      "owner_version": session.owner_version,
    }
