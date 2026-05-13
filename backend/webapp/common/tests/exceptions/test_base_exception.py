from common.exceptions import (
  BaseException,
  ConflictException,
  NotFoundException,
  PermissionDeniedException,
  RateLimitException,
  ServiceUnavailableException,
  UnauthorizedException,
)
from django.test import TestCase
from rest_framework import status


class BaseExceptionTest(TestCase):
  """BaseException 테스트"""

  def test_default_status_code(self):
    """기본 status_code가 500인지 확인"""
    exc = BaseException()
    self.assertEqual(exc.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

  def test_default_error_code(self):
    """기본 error_code가 INTERNAL_ERROR인지 확인"""
    exc = BaseException()
    self.assertEqual(exc.error_code, "INTERNAL_ERROR")

  def test_custom_detail_override(self):
    """인스턴스 레벨 detail 오버라이드 확인"""
    exc = BaseException(detail="커스텀 메시지")
    self.assertEqual(str(exc.detail), "커스텀 메시지")

  def test_custom_error_code_override(self):
    """인스턴스 레벨 error_code 오버라이드 확인"""
    exc = BaseException(error_code="CUSTOM_CODE")
    self.assertEqual(exc.error_code, "CUSTOM_CODE")

  def test_to_response_data_format(self):
    """to_response_data()가 올바른 포맷을 반환하는지 확인"""
    exc = BaseException(detail="테스트")
    data = exc.to_response_data()
    self.assertIn("error_code", data)
    self.assertIn("message", data)
    self.assertEqual(data["message"], "테스트")


class SubclassExceptionTest(TestCase):
  """각 예외 서브클래스의 status_code, error_code 테스트"""

  def test_not_found_exception(self):
    """NotFoundException이 404를 반환하는지 확인"""
    exc = NotFoundException()
    self.assertEqual(exc.status_code, status.HTTP_404_NOT_FOUND)
    self.assertEqual(exc.error_code, "NOT_FOUND")

  def test_permission_denied_exception(self):
    """PermissionDeniedException이 403을 반환하는지 확인"""
    exc = PermissionDeniedException()
    self.assertEqual(exc.status_code, status.HTTP_403_FORBIDDEN)
    self.assertEqual(exc.error_code, "PERMISSION_DENIED")

  def test_unauthorized_exception(self):
    """UnauthorizedException이 401을 반환하는지 확인"""
    exc = UnauthorizedException()
    self.assertEqual(exc.status_code, status.HTTP_401_UNAUTHORIZED)
    self.assertEqual(exc.error_code, "UNAUTHORIZED")

  def test_conflict_exception(self):
    """ConflictException이 409를 반환하는지 확인"""
    exc = ConflictException()
    self.assertEqual(exc.status_code, status.HTTP_409_CONFLICT)
    self.assertEqual(exc.error_code, "CONFLICT")

  def test_rate_limit_exception(self):
    """RateLimitException이 429를 반환하는지 확인"""
    exc = RateLimitException()
    self.assertEqual(exc.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
    self.assertEqual(exc.error_code, "RATE_LIMIT_EXCEEDED")

  def test_service_unavailable_exception(self):
    """ServiceUnavailableException이 503을 반환하는지 확인"""
    exc = ServiceUnavailableException()
    self.assertEqual(exc.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
    self.assertEqual(exc.error_code, "SERVICE_UNAVAILABLE")

  def test_app_level_inheritance(self):
    """앱 레벨 상속이 정상 동작하는지 확인"""

    class InterviewNotFoundException(NotFoundException):
      error_code = "INTERVIEW_NOT_FOUND"
      default_detail = "면접을 찾을 수 없습니다."

    exc = InterviewNotFoundException()
    self.assertEqual(exc.status_code, status.HTTP_404_NOT_FOUND)
    self.assertEqual(exc.error_code, "INTERVIEW_NOT_FOUND")
    self.assertEqual(str(exc.detail), "면접을 찾을 수 없습니다.")
