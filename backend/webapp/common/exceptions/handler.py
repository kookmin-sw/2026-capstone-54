"""
DRF 커스텀 예외 핸들러.

DRF/Django 예외를 통일된 응답 포맷으로 변환한다.
settings.py에 아래와 같이 등록한다::

  REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "common.exceptions.handler.custom_exception_handler",
  }
"""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework.response import Response
from rest_framework.views import exception_handler

from .base_exception import BaseException
from .validation_exception import ValidationException


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
      message = "중복된 데이터가 이미 존재합니다."
    else:
      message = "데이터 무결성 오류가 발생했습니다."

    ve = ValidationException(detail=message)
    return Response(ve.to_response_data(), status=ve.status_code)

  # DRF 기본 핸들러
  response = exception_handler(exc, context)
  if response is None:
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
    message = (detail.get("detail", "오류가 발생했습니다.") if isinstance(detail, dict) else str(detail))
    response.data = {
      "error_code": f"HTTP_{response.status_code}",
      "message": str(message),
    }

  return response
