from rest_framework import status as http_status

from .base_exception import BaseException


class PermissionDeniedException(BaseException):
  """권한 없음"""
  status_code = http_status.HTTP_403_FORBIDDEN
  error_code = "PERMISSION_DENIED"
  default_detail = "접근 권한이 없습니다."
