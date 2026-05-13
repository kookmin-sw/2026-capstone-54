"""
N+1 감지 후 요청 완료 시점까지 알림을 지연시키는 pending 저장소.

emit() 시점에는 N+1 반복 쿼리가 아직 실행 중이므로 SQL 을 바로 수집할 수 없다.
request_finished signal 에서 flush() 를 호출해 SQL 을 수집하고 Celery task 를 전송한다.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

from .request import get_request_id
from .sql import collect_sql

_TTL = 3600
_CLEANUP_INTERVAL = 100


@dataclass
class PendingAlert:
  model: str
  field: str
  path: str
  method: str
  stacktrace: str
  query_snapshot_index: int
  registered_at: float = 0.0

  def __post_init__(self) -> None:
    if not self.registered_at:
      self.registered_at = time.monotonic()


# 모듈 레벨 상태 — 프로세스 수명 동안 유지
_emit_count = 0
_seen: dict[tuple[str, str, str], float] = {}
_pending: dict[str, list[PendingAlert]] = {}


def is_duplicate(request_id: str, model: str, field: str) -> bool:
  """같은 요청에서 동일한 (model, field) 조합이 이미 감지됐으면 True."""
  global _emit_count

  key = (request_id, model, field)
  if key in _seen:
    return True

  _seen[key] = time.monotonic()
  _emit_count += 1
  if _emit_count % _CLEANUP_INTERVAL == 0:
    _evict_expired()
  return False


def register(request_id: str, alert: PendingAlert) -> None:
  """pending 저장소에 alert 를 등록한다."""
  _pending.setdefault(request_id, []).append(alert)


def flush(request_id: str) -> None:
  """요청 완료 시 pending alert 를 처리하고 Celery task 를 전송한다."""
  alerts = _pending.pop(request_id, [])
  if not alerts:
    return

  from common.tasks.send_nplusone_alert_task import RegisteredSendNPlusOneAlertTask

  for alert in alerts:
    RegisteredSendNPlusOneAlertTask.delay(
      model=alert.model,
      field=alert.field,
      path=alert.path,
      method=alert.method,
      stacktrace=alert.stacktrace,
      sql_log=collect_sql(alert.model, alert.field, alert.query_snapshot_index),
    )


def connect_signal() -> None:
  """request_finished Django signal 에 flush 를 연결한다. 최초 1회만 호출한다."""
  from django.core.signals import request_finished

  def on_request_finished(sender, **kwargs):  # noqa: ANN001
    if request_id := get_request_id():
      flush(request_id)

  request_finished.connect(on_request_finished, weak=False)


def _evict_expired() -> None:
  """TTL 이 지난 _seen / _pending 항목을 제거한다."""
  cutoff = time.monotonic() - _TTL

  # _seen 정리
  expired_seen = [k for k, ts in _seen.items() if ts < cutoff]
  for k in expired_seen:
    del _seen[k]

  # _pending 정리 — request_finished 가 호출되지 않아 남은 항목 제거
  expired_pending = [rid for rid, alerts in _pending.items() if alerts and alerts[0].registered_at < cutoff]
  for rid in expired_pending:
    del _pending[rid]
