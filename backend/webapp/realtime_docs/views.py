"""
Realtime Docs 뷰.

/realtime-docs/          — AsyncAPI UI (HTML)
/realtime-docs/schema/   — AsyncAPI JSON 스펙
"""

from __future__ import annotations

import json

from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render

from .registry import registry
from .schema import generate_asyncapi_spec


def docs_ui(request: HttpRequest) -> HttpResponse:
  """AsyncAPI UI 페이지를 렌더링한다."""
  spec = generate_asyncapi_spec(request)
  consumers = registry.all()
  return render(
    request,
    "realtime_docs/index.html",
    {
      "spec_json": json.dumps(spec, ensure_ascii=False),
      "consumers": consumers,
      "ws_scheme": "wss" if request.is_secure() else "ws",
      "http_scheme": "https" if request.is_secure() else "http",
      "host": request.get_host(),
    },
  )


def docs_schema(request: HttpRequest) -> JsonResponse:
  """AsyncAPI JSON 스펙을 반환한다."""
  spec = generate_asyncapi_spec(request)
  return JsonResponse(spec, json_dumps_params={"ensure_ascii": False, "indent": 2})
