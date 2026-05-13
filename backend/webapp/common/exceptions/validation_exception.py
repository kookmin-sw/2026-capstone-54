"""
유효성 검증 예외 모듈.

Usage::

  raise ValidationException(
    field_errors={
      "title": ["제목은 필수입니다."],
      "content": ["내용은 100자 이상이어야 합니다."],
    }
  )
"""

from rest_framework import status as http_status

from .base_exception import BaseException


class ValidationException(BaseException):
  """필드별 유효성 검증 에러"""
  status_code = http_status.HTTP_400_BAD_REQUEST
  error_code = "VALIDATION_ERROR"
  default_detail = "입력값이 올바르지 않습니다."

  def __init__(self, detail=None, field_errors=None, **kwargs):
    super().__init__(detail=detail, **kwargs)
    self.field_errors = field_errors or {}

  def to_response_data(self):
    data = super().to_response_data()
    if self.field_errors:
      data["field_errors"] = self.field_errors
    return data
