from rest_framework import status as http_status

from .base_exception import BaseException


class NotFoundException(BaseException):
  """리소스를 찾을 수 없음"""
  status_code = http_status.HTTP_404_NOT_FOUND
  error_code = "NOT_FOUND"
  default_detail = "요청한 리소스를 찾을 수 없습니다."
