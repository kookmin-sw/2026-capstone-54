"""인터뷰 세션 owner 검증 통합용 테스트 헬퍼."""

import hashlib

from rest_framework_simplejwt.tokens import RefreshToken

TEST_OWNER_TOKEN = "test-owner-token"
TEST_OWNER_VERSION = 1


class OwnershipHeadersMixin:
  """세션에 ownership 을 발급하고 클라이언트 default 헤더에 owner 토큰을 부여한다."""

  TEST_OWNER_TOKEN = TEST_OWNER_TOKEN
  TEST_OWNER_VERSION = TEST_OWNER_VERSION

  def setup_session_ownership(self, session) -> None:
    session.owner_token_hash = hashlib.sha256(self.TEST_OWNER_TOKEN.encode()).hexdigest()
    session.owner_version = self.TEST_OWNER_VERSION
    session.save(update_fields=["owner_token_hash", "owner_version"])

  def authenticate_with_ownership(self, user, session) -> None:
    self.setup_session_ownership(session)
    refresh_token = RefreshToken.for_user(user)
    self.client.credentials(
      HTTP_AUTHORIZATION=f"Bearer {refresh_token.access_token}",
      HTTP_X_SESSION_OWNER_TOKEN=self.TEST_OWNER_TOKEN,
      HTTP_X_SESSION_OWNER_VERSION=str(self.TEST_OWNER_VERSION),
    )
