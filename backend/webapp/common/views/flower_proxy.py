"""Flower 모니터링 UI 프록시 — Django admin 인증(is_staff) 전용."""

import urllib.error
import urllib.request
from urllib.parse import urlparse

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt

_FLOWER_BASE = settings.FLOWER_INTERNAL_URL

# settings 값이 http(s):// 이외의 scheme이면 서버 시작 시점에 즉시 실패
_scheme = urlparse(_FLOWER_BASE).scheme
if _scheme not in {"http", "https"}:
  raise ValueError(f"FLOWER_INTERNAL_URL scheme must be http or https, got: {_scheme!r}")


@csrf_exempt
def flower_proxy(request: HttpRequest, path: str = "") -> HttpResponse:
  """내부 Flower 서비스로 요청을 포워딩합니다."""
  target = f"{_FLOWER_BASE}/admin/flower/{path}"
  if qs := request.META.get("QUERY_STRING"):
    target += f"?{qs}"

  try:
    proxy_req = urllib.request.Request(
      url=target,
      method=request.method,
      data=request.body or None,
      headers={
        k: v
        for k, v in request.headers.items() if k.lower() not in {"host", "content-length", "accept-encoding"}
      },
    )
    with urllib.request.urlopen(proxy_req, timeout=30) as resp:  # nosec B310
      return HttpResponse(
        content=resp.read(),
        content_type=resp.headers.get("Content-Type", "text/html"),
        status=resp.status,
      )
  except urllib.error.HTTPError as e:
    return HttpResponse(status=e.code)
  except Exception:
    return HttpResponse(status=502)
