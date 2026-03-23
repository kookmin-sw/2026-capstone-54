from rest_framework import status as http_status

from .base_exception import BaseException


class ConflictException(BaseException):
  """리소스 충돌"""
  status_code = http_status.HTTP_409_CONFLICT
  error_code = "CONFLICT"
  default_detail = "리소스가 충돌합니다."
