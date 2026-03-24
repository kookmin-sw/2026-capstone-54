"""
현재 요청의 메타데이터(request_id, path, method, query count)를 가져오는 유틸.
"""

from __future__ import annotations

from crequest.middleware import CrequestMiddleware
from django.db import connection
from django_guid.middleware import GuidMiddleware


def get_request_id() -> str:
  """django-guid 가 부여한 현재 요청의 correlation ID 를 반환한다."""
  return GuidMiddleware.get_guid(default="") or ""


def get_request_info() -> tuple[str, str]:
  """현재 요청의 (path, method) 를 반환한다."""
  request = CrequestMiddleware.get_request()
  if request is None:
    return "", ""
  return request.path, request.method


def get_query_count() -> int:
  """현재 connection.queries 길이를 반환한다."""
  return len(connection.queries)
