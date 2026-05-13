"""
공통 예외 베이스 모듈.

모든 커스텀 예외는 BaseException을 상속한다.
DRF의 APIException을 상속하므로 view 내에서 raise하면
DRF가 자동으로 응답을 생성한다.

Usage::

  # 앱별 예외 정의
  class ResumeNotFoundException(NotFoundException):
    error_code = "RESUME_NOT_FOUND"
    default_detail = "이력서를 찾을 수 없습니다."

  # 인스턴스 레벨 메시지 오버라이드
  raise BaseException(detail="커스텀 메시지")
"""

from rest_framework import status as http_status
from rest_framework.exceptions import APIException


class BaseException(APIException):
  """앱 전체 예외의 베이스 클래스"""
  status_code = http_status.HTTP_500_INTERNAL_SERVER_ERROR
  error_code = "INTERNAL_ERROR"
  default_detail = "서버 내부 오류가 발생했습니다."

  def __init__(self, detail=None, error_code=None):
    if error_code is not None:
      self.error_code = error_code
    if detail is None:
      detail = self.default_detail
    super().__init__(detail=detail)

  def to_response_data(self):
    return {
      "error_code": self.error_code,
      "message": str(self.detail),
    }
