"""Owner token 검증 헬퍼."""
import hashlib

from common.exceptions import ConflictException
from django.core.cache import cache


def validate_session_owner(session, owner_token: str, owner_version: int):
  """Redis owner_token 일치 + DB owner_version 일치를 검증한다.

  Redis 정상: cache 값 비교
  Redis timeout/down: DB owner_token_hash + owner_version 비교 (fallback)

  실패 시 ConflictException(SESSION_OWNER_CHANGED).
  """
  if not owner_token or owner_version is None:
    raise ConflictException(error_code="SESSION_OWNER_REQUIRED", detail="세션 소유자 토큰이 필요합니다.")

  cache_key = f"interview_session_owner:{session.uuid}"

  try:
    redis_token = cache.get(cache_key)
  except Exception:
    redis_token = None  # Redis 장애 시 DB fallback

  expected_hash = hashlib.sha256(owner_token.encode()).hexdigest()

  if redis_token is not None:
    # Redis 정상: 직접 비교
    if redis_token != owner_token:
      raise ConflictException(error_code="SESSION_OWNER_CHANGED", detail="다른 곳에서 인터뷰가 진행 중입니다.")
  else:
    # Redis fallback: DB hash 비교
    if session.owner_token_hash != expected_hash:
      raise ConflictException(error_code="SESSION_OWNER_CHANGED", detail="다른 곳에서 인터뷰가 진행 중입니다.")

  # owner_version 비교 (둘 다 필수)
  if session.owner_version != owner_version:
    raise ConflictException(error_code="SESSION_OWNER_CHANGED", detail="세션 소유권이 변경되었습니다.")
