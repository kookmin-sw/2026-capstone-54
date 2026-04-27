"""Mutate API 의 X-Session-Owner-* 헤더 추출 + 검증 헬퍼."""

from common.exceptions import ConflictException
from interviews.services import validate_session_owner

OWNER_TOKEN_HEADER = "X-Session-Owner-Token"
OWNER_VERSION_HEADER = "X-Session-Owner-Version"


def require_session_owner_from_request(request, session) -> None:
  """요청 헤더에서 owner_token / owner_version 을 추출하고 검증한다."""
  owner_token = request.headers.get(OWNER_TOKEN_HEADER, "")
  owner_version_raw = request.headers.get(OWNER_VERSION_HEADER)
  if owner_version_raw is None:
    raise ConflictException(
      error_code="SESSION_OWNER_REQUIRED",
      detail="세션 소유자 정보가 누락되었습니다.",
    )

  try:
    owner_version = int(owner_version_raw)
  except (TypeError, ValueError) as exc:
    raise ConflictException(
      error_code="SESSION_OWNER_REQUIRED",
      detail="세션 소유자 정보가 잘못되었습니다.",
    ) from exc

  validate_session_owner(session, owner_token, owner_version)
