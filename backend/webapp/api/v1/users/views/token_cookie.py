from django.conf import settings
from rest_framework.response import Response

REFRESH_COOKIE_NAME = "mefit_refresh"
REFRESH_COOKIE_PATH = "/api/v1/users/"


def _is_secure_cookie() -> bool:
  # Django test client는 secure cookie를 HTTP에서 전송하지 않으므로
  # 테스트 환경에서는 secure=False로 설정해 쿠키 기반 인증 흐름을 검증한다.
  if "test" in getattr(settings, "ENVIRONMENT", ""):
    return False
  return not settings.DEBUG


def set_refresh_cookie(response: Response, refresh_token: str) -> None:
  max_age = int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())
  response.set_cookie(
    key=REFRESH_COOKIE_NAME,
    value=refresh_token,
    max_age=max_age,
    httponly=True,
    secure=_is_secure_cookie(),
    samesite="Lax",
    path=REFRESH_COOKIE_PATH,
  )


def clear_refresh_cookie(response: Response) -> None:
  response.delete_cookie(
    key=REFRESH_COOKIE_NAME,
    path=REFRESH_COOKIE_PATH,
    samesite="Lax",
  )
