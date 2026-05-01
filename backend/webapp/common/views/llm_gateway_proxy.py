"""LiteLLM Gateway 어드민 UI 프록시 — Django admin 인증(is_staff) 전용.

Flower 프록시와 다른 점:
- LiteLLM 의 ``SERVER_ROOT_PATH`` env 는 일반 FastAPI ``root_path`` 와 다르게
  동작한다. FastAPI ``root_path`` 는 OpenAPI/redirect 에만 영향을 주고 라우트는
  원래 path 로 등록되지만, LiteLLM 은 ``SERVER_ROOT_PATH`` 의 값을 **실제 라우팅
  path 의 prefix 로 포함** 시키고 HTML 의 ``<script src=...>`` 같은 자산 URL 도
  같은 prefix 를 붙여서 생성한다.
  ConfigMap 에 ``SERVER_ROOT_PATH=/admin/llm-gateway`` 가 설정되어 있으므로
  프록시는 prefix 를 **그대로 유지하여** ``/admin/llm-gateway/<path>`` 로
  forward 해야 한다 (벗기면 자산 URL 도 strip 되어 404 cascade 발생).
- LiteLLM UI 는 ``token`` 쿠키(JWT) 기반 세션을 사용하므로 응답의 ``Set-Cookie`` 를
  반드시 그대로 전달해야 한다.
"""

import logging
import urllib.error
import urllib.request
from http.cookies import SimpleCookie
from urllib.parse import urlparse

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger(__name__)

_LLM_GATEWAY_BASE = settings.LLM_GATEWAY_INTERNAL_URL

# 빈 문자열은 dev/test 환경에서 LiteLLM 이 미배포 상태임을 의미. 검증 skip.
# 비어 있지 않으면 import 시점에 scheme 검증 — 잘못된 설정은 즉시 실패.
if _LLM_GATEWAY_BASE:
  _scheme = urlparse(_LLM_GATEWAY_BASE).scheme
  if _scheme not in {"http", "https"}:
    raise ValueError(f"LLM_GATEWAY_INTERNAL_URL scheme must be http or https, got: {_scheme!r}")

# 프록시 시 제거할 hop-by-hop / 충돌 헤더 (요청)
_REQUEST_SKIP_HEADERS = frozenset({
  "host",
  "content-length",
  "accept-encoding",
  "connection",
  "transfer-encoding",
})

# 응답에서 그대로 forward 하면 안 되는 헤더.
# ``set-cookie`` 는 SimpleCookie 로 별도 처리 (다중값 보존).
# ``content-encoding`` / ``content-length`` 는 urllib 가 이미 압축 해제한 본문을
# 다시 보내므로 빼야 한다.
_RESPONSE_SKIP_HEADERS = frozenset(
  {
    "connection",
    "transfer-encoding",
    "content-encoding",
    "content-length",
    "keep-alive",
    "set-cookie",
  }
)


@csrf_exempt
def llm_gateway_proxy(request: HttpRequest, path: str = "") -> HttpResponse:
  """내부 LiteLLM Gateway 서비스로 요청을 포워딩합니다.

  ``/admin/llm-gateway/<path>`` 로 들어온 요청을 prefix 를 그대로 유지하여
  LiteLLM 내부 서비스의 ``/admin/llm-gateway/<path>`` 로 forward 한다.
  LiteLLM 의 ``SERVER_ROOT_PATH`` 가 라우트 path 와 자산 URL 양쪽에 prefix 를
  포함시키므로 prefix 를 보존해야 자산까지 일관되게 동작한다.
  """
  if not _LLM_GATEWAY_BASE:
    return HttpResponse(
      content=b"LLM Gateway is not configured in this environment.",
      content_type="text/plain",
      status=503,
    )

  target = f"{_LLM_GATEWAY_BASE}/admin/llm-gateway/{path}"
  if qs := request.META.get("QUERY_STRING"):
    target += f"?{qs}"

  headers = {k: v for k, v in request.headers.items() if k.lower() not in _REQUEST_SKIP_HEADERS}

  # POST/PUT 등 body 가 있는 요청은 data 를 반드시 bytes 로 전달해야
  # urllib 가 메서드를 GET 으로 바꾸지 않는다.
  body = request.body if request.method in {"POST", "PUT", "PATCH", "DELETE"} else None

  try:
    proxy_req = urllib.request.Request(
      url=target,
      method=request.method,
      data=body,
      headers=headers,
    )
    with urllib.request.urlopen(proxy_req, timeout=30) as resp:  # nosec B310
      return _build_proxy_response(resp.read(), resp.status, resp.headers)
  except urllib.error.HTTPError as e:
    body_content = e.read() if hasattr(e, "read") else b""
    return _build_proxy_response(body_content, e.code, e.headers)
  except Exception:
    logger.exception(
      "llm_gateway_proxy_failed method=%s target=%s",
      request.method,
      target,
    )
    return HttpResponse(status=502)


def _build_proxy_response(content: bytes, status: int, upstream_headers) -> HttpResponse:
  """업스트림 응답을 Django HttpResponse 로 빌드 — Set-Cookie 다중값 정확히 전달."""
  content_type = "text/html"
  if upstream_headers is not None:
    content_type = upstream_headers.get("Content-Type", "text/html")

  response = HttpResponse(content=content, content_type=content_type, status=status)

  if upstream_headers is None:
    return response

  # urllib 의 HTTPMessage 는 동일 헤더가 여러 번 등장하면 .items() / .keys() 가
  # 각 인스턴스를 별도 항목으로 yield 한다. 단순 ``response[key] = value`` 루프는
  # 마지막 값으로 덮어쓰므로 ``Vary``, ``Cache-Control`` 같은 다중값을 잃는다.
  # RFC 7230 §3.2.2 에 따라 combinable 헤더는 ", " 로 join 해 한 번만 set 한다.
  # ``Set-Cookie`` 는 join 불가능 — 아래 SimpleCookie 블록에서 별도 처리.
  seen_keys: set[str] = set()
  for key in upstream_headers.keys():
    lowered = key.lower()
    if lowered in _RESPONSE_SKIP_HEADERS or lowered in seen_keys:
      continue
    seen_keys.add(lowered)
    if hasattr(upstream_headers, "get_all"):
      values = upstream_headers.get_all(key) or []
    else:
      single = upstream_headers.get(key)
      values = [single] if single is not None else []
    values = [v for v in values if v is not None]
    if values:
      response[key] = ", ".join(values)

  # LiteLLM 의 ``token`` / ``litellm_cp_return_to`` 쿠키 등을 SimpleCookie 로
  # 파싱해 morsel 속성(HttpOnly, Secure, SameSite ...) 을 보존하면서 재설정.
  if hasattr(upstream_headers, "get_all"):
    set_cookie_values = upstream_headers.get_all("Set-Cookie") or []
  else:
    single_value = upstream_headers.get("Set-Cookie")
    set_cookie_values = [single_value] if single_value else []

  for cookie_header in set_cookie_values:
    cookie = SimpleCookie()
    cookie.load(cookie_header)
    for name, morsel in cookie.items():
      response.cookies[name] = morsel.value
      for attr_key, attr_val in morsel.items():
        if attr_val != "":
          response.cookies[name][attr_key] = attr_val

  return response
