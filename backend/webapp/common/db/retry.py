from collections.abc import Callable
from typing import TypeVar

from django.db import IntegrityError

T = TypeVar("T")


def run_with_integrity_retry(
  action: Callable[[], T],
  *,
  max_retries: int = 3,
  final_error_message: str | None = None,
) -> T:
  """IntegrityError 발생 시 지정 횟수만큼 작업을 재시도한다."""
  for attempt in range(1, max_retries + 1):
    try:
      return action()
    except IntegrityError as exc:
      if attempt == max_retries:
        if final_error_message:
          raise IntegrityError(final_error_message) from exc
        raise

  raise IntegrityError("무결성 검증 재시도 후에도 작업에 실패했습니다.")
