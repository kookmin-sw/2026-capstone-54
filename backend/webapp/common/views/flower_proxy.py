"""Flower 모니터링 UI 프록시 — Django admin 인증(is_staff) 전용."""

import urllib.error
import urllib.request

from django.conf import settings
from django.http import HttpRequest, HttpResponse

_FLOWER_BASE = settings.FLOWER_INTERNAL_URL


def flower_proxy(request: HttpRequest, path: str = "") -> HttpResponse:
  """내부 Flower 서비스로 요청을 포워딩합니다."""
  target = f"{_FLOWER_BASE}/admin/flower/{path}"
  if qs := request.META.get("QUERY_STRING"):
    target += f"?{qs}"

  try:
    proxy_req = urllib.request.Request(url=target, method=request.method)
    with urllib.request.urlopen(proxy_req, timeout=15) as resp:
      return HttpResponse(
        content=resp.read(),
        content_type=resp.headers.get("Content-Type", "text/html"),
        status=resp.status,
      )
  except urllib.error.HTTPError as e:
    return HttpResponse(content=e.read(), content_type="text/html", status=e.code)
  except Exception as e:
    return HttpResponse(
      content=f"Flower 연결 오류: {e}",
      content_type="text/html",
      status=502,
    )
