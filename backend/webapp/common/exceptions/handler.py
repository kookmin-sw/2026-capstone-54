"""
DRF 커스텀 예외 핸들러.

DRF/Django 예외를 통일된 응답 포맷으로 변환한다.
settings.py에 아래와 같이 등록한다::

  REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "common.exceptions.handler.custom_exception_handler",
  }

5xx 에러 발생 시 Slack 에 비동기로 알림을 전송한다.
"""

import traceback

import structlog
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework.response import Response
from rest_framework.views import exception_handler

from .base_exception import BaseException
from .conflict_exception import ConflictException
from .validation_exception import ValidationException

logger = structlog.get_logger(__name__)


def _notify_slack_error(exc: Exception, context: dict) -> None:
  """5xx 에러를 Slack 에 비동기로 알린다. 실패해도 응답에 영향을 주지 않는다."""
  try:
    from common.tasks.send_error_alert_task import RegisteredSendErrorAlertTask

    request = context.get("request")

    RegisteredSendErrorAlertTask.delay(
      error_type=type(exc).__name__,
      error_message=str(exc),
      path=request.path if request else "",
      method=request.method if request else "",
      traceback=traceback.format_exc(),
    )

  except Exception:
    logger.warning("slack_error_notify_failed", exc_info=True)


def custom_exception_handler(exc, context):
  """DRF/Django/커스텀 예외를 통일된 포맷으로 변환한다."""

  # 커스텀 예외는 to_response_data()로 응답
  if isinstance(exc, BaseException):
    return Response(
      exc.to_response_data(),
      status=exc.status_code,
    )

  # Django ValidationError 변환
  if isinstance(exc, DjangoValidationError):
    if hasattr(exc, "message_dict"):
      field_errors = {k: v for k, v in exc.message_dict.items() if k != "__all__"}
      message = exc.message_dict.get("__all__", ["입력값이 올바르지 않습니다."])[0]
    else:
      field_errors = {}
      message = str(exc.message) if hasattr(exc, "message") else str(exc)

    ve = ValidationException(detail=message, field_errors=field_errors)
    return Response(ve.to_response_data(), status=ve.status_code)

  # IntegrityError 변환
  if isinstance(exc, IntegrityError):
    error_str = str(exc).lower()
    if "unique" in error_str:
      ce = ConflictException(detail="중복된 데이터가 이미 존재합니다.")
      return Response(ce.to_response_data(), status=ce.status_code)

    ve = ValidationException(detail="데이터 무결성 오류가 발생했습니다.")
    return Response(ve.to_response_data(), status=ve.status_code)

  # DRF 기본 핸들러
  response = exception_handler(exc, context)
  if response is None:
    # DRF 가 처리하지 못한 예외 (= 500) → Slack 알림
    _notify_slack_error(exc, context)
    return None

  detail = response.data

  # DRF ValidationError → field_errors 추출
  if response.status_code == 400 and isinstance(detail, dict):
    non_field = detail.pop("non_field_errors", None)
    field_errors = {k: v for k, v in detail.items() if k != "detail"}
    message = (non_field[0] if non_field else detail.get("detail", "입력값이 올바르지 않습니다."))
    ve = ValidationException(
      detail=str(message),
      field_errors=field_errors if field_errors else {},
    )
    response.data = ve.to_response_data()
  else:
    # 5xx 응답 → Slack 알림
    if response.status_code >= 500:
      _notify_slack_error(exc, context)

    message = (detail.get("detail", "오류가 발생했습니다.") if isinstance(detail, dict) else str(detail))
    response.data = {
      "error_code": f"HTTP_{response.status_code}",
      "message": str(message),
    }

  return response
