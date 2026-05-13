from rest_framework import status as http_status

from .base_exception import BaseException


class UnauthorizedException(BaseException):
  """인증 필요"""
  status_code = http_status.HTTP_401_UNAUTHORIZED
  error_code = "UNAUTHORIZED"
  default_detail = "인증이 필요합니다."
