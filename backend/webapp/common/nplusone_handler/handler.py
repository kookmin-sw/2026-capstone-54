"""
nplusone 감지 로그를 Slack 으로 전송하는 logging.Handler.
"""

from __future__ import annotations

import logging
import re

from .pending import PendingAlert, connect_signal, is_duplicate, register
from .request import get_query_count, get_request_id, get_request_info
from .stacktrace import extract_app_stacktrace


class NPlusOneSlackHandler(logging.Handler):
  """nplusone 로그를 Slack 으로 전송하는 핸들러.

    동작 흐름:
      1. emit()               — N+1 감지 시 stacktrace 수집 + pending 등록
      2. request_finished     — 요청 완료 후 SQL 수집 + Celery task 전송
    """

  _PATTERN = re.compile(r"`(?P<model>[^.`]+)\.(?P<field>[^`]+)`")
  _signal_connected = False

  def __init__(self, *args, **kwargs) -> None:
    super().__init__(*args, **kwargs)
    if not NPlusOneSlackHandler._signal_connected:
      connect_signal()
      NPlusOneSlackHandler._signal_connected = True

  def emit(self, record: logging.LogRecord) -> None:
    try:
      msg = record.getMessage()
      if "unnecessary eager load" in msg:
        return
      self._handle(record)
    except Exception:
      self.handleError(record)

  def _handle(self, record: logging.LogRecord) -> None:
    msg = record.getMessage()
    m = self._PATTERN.search(msg)
    model = m.group("model") if m else "Unknown"
    field = m.group("field") if m else "Unknown"

    request_id = get_request_id()
    if is_duplicate(request_id, model, field):
      return

    path, method = get_request_info()
    register(
      request_id,
      PendingAlert(
        model=model,
        field=field,
        path=path,
        method=method,
        stacktrace=extract_app_stacktrace(),
        query_snapshot_index=get_query_count(),
      )
    )
