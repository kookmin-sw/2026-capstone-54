"""
현재 요청의 메타데이터(request_id, path, method, query count)를 가져오는 유틸.
"""

from __future__ import annotations


def get_request_id() -> str:
  """django-guid 가 부여한 현재 요청의 correlation ID 를 반환한다."""
  try:
    from django_guid.middleware import GuidMiddleware
    return GuidMiddleware.get_guid(default="") or ""
  except Exception:
    return ""


def get_request_info() -> tuple[str, str]:
  """현재 요청의 (path, method) 를 반환한다."""
  try:
    from crequest.middleware import CrequestMiddleware
    if request := CrequestMiddleware.get_request():
      return request.path, request.method
  except Exception:
    pass
  return "", ""


def get_query_count() -> int:
  """현재 connection.queries 길이를 반환한다."""
  try:
    from django.db import connection
    return len(connection.queries)
  except Exception:
    return 0
