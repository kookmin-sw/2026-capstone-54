from rest_framework import status as http_status

from .base_exception import BaseException


class ServiceUnavailableException(BaseException):
  """외부 서비스 이용 불가"""
  status_code = http_status.HTTP_503_SERVICE_UNAVAILABLE
  error_code = "SERVICE_UNAVAILABLE"
  default_detail = "서비스를 일시적으로 이용할 수 없습니다."
