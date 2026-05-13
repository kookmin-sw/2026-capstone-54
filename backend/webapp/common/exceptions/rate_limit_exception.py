from rest_framework import status as http_status

from .base_exception import BaseException


class RateLimitException(BaseException):
  """요청 횟수 초과"""
  status_code = http_status.HTTP_429_TOO_MANY_REQUESTS
  error_code = "RATE_LIMIT_EXCEEDED"
  default_detail = "요청 횟수를 초과했습니다."
