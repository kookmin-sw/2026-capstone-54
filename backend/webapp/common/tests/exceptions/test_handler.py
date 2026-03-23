from common.exceptions import NotFoundException, ValidationException
from common.views import BaseAPIView
from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.exceptions import (
  MethodNotAllowed,
  NotAuthenticated,
)
from rest_framework.exceptions import NotFound as DRFNotFound
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
from rest_framework.exceptions import (
  Throttled,
)
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()

# --- 테스트용 뷰 클래스 ---


class RaiseNotFoundView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise NotFoundException()


class RaiseValidationView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise ValidationException(field_errors={"email": ["이메일 형식이 올바르지 않습니다."]})


class RaiseDjangoValidationView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise DjangoValidationError({"name": ["이름은 필수입니다."]})


class RaiseDjangoValidationErrorSimpleView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise DjangoValidationError("단순 에러 메시지")


class RaiseCustomInheritedView(BaseAPIView):
  permission_classes = []

  def get(self, request):

    class InterviewNotFoundException(NotFoundException):
      error_code = "INTERVIEW_NOT_FOUND"
      default_detail = "면접을 찾을 수 없습니다."

    raise InterviewNotFoundException()


class RaiseDRFNotFoundView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise DRFNotFound()


class RaiseDRFPermissionDeniedView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise DRFPermissionDenied()


class RaiseDRFNotAuthenticatedView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise NotAuthenticated()


class RaiseDRFMethodNotAllowedView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise MethodNotAllowed("POST")


class RaiseDRFThrottledView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise Throttled(wait=60)


class RaiseDRFValidationErrorView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise DRFValidationError({"email": ["올바른 이메일을 입력하세요."]})


class RaiseDRFValidationErrorNonFieldView(BaseAPIView):
  permission_classes = []

  def get(self, request):
    raise DRFValidationError({"non_field_errors": ["비밀번호가 일치하지 않습니다."]})


# --- 커스텀 예외 핸들링 테스트 ---


class HandlerNotFoundTest(TestCase):
  """핸들러 NotFoundException 처리 테스트"""

  def test_returns_404_with_error_code(self):
    """NotFoundException이 404와 올바른 error_code를 반환하는지 확인"""
    request = factory.get("/test/")
    response = RaiseNotFoundView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    self.assertEqual(response.data["error_code"], "NOT_FOUND")
    self.assertIn("message", response.data)


class HandlerValidationTest(TestCase):
  """핸들러 ValidationException 처리 테스트"""

  def test_returns_400_with_field_errors(self):
    """ValidationException이 400과 field_errors를 반환하는지 확인"""
    request = factory.get("/test/")
    response = RaiseValidationView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(response.data["error_code"], "VALIDATION_ERROR")
    self.assertIn("field_errors", response.data)
    self.assertIn("email", response.data["field_errors"])


class HandlerCustomInheritedTest(TestCase):
  """핸들러 앱 레벨 상속 예외 처리 테스트"""

  def test_inherited_exception_preserves_error_code(self):
    """상속된 예외의 error_code가 유지되는지 확인"""
    request = factory.get("/test/")
    response = RaiseCustomInheritedView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    self.assertEqual(response.data["error_code"], "INTERVIEW_NOT_FOUND")
    self.assertEqual(response.data["message"], "면접을 찾을 수 없습니다.")


# --- Django 예외 핸들링 테스트 ---


class HandlerDjangoValidationTest(TestCase):
  """핸들러 Django ValidationError 변환 테스트"""

  def test_converts_django_validation_error(self):
    """Django ValidationError(dict)가 통일된 포맷으로 변환되는지 확인"""
    request = factory.get("/test/")
    response = RaiseDjangoValidationView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(response.data["error_code"], "VALIDATION_ERROR")
    self.assertIn("field_errors", response.data)
    self.assertIn("name", response.data["field_errors"])

  def test_simple_django_validation_error(self):
    """Django ValidationError(문자열)가 통일된 포맷으로 변환되는지 확인"""
    request = factory.get("/test/")
    response = RaiseDjangoValidationErrorSimpleView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(response.data["error_code"], "VALIDATION_ERROR")
    self.assertNotIn("field_errors", response.data)


# --- DRF 내장 예외 핸들링 테스트 ---


class HandlerDRFNotFoundTest(TestCase):
  """DRF NotFound 예외 처리 테스트"""

  def test_drf_not_found_returns_unified_format(self):
    """DRF NotFound가 통일된 포맷으로 변환되는지 확인"""
    request = factory.get("/test/")
    response = RaiseDRFNotFoundView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    self.assertIn("error_code", response.data)
    self.assertIn("message", response.data)


class HandlerDRFPermissionDeniedTest(TestCase):
  """DRF PermissionDenied 예외 처리 테스트"""

  def test_drf_permission_denied_returns_unified_format(self):
    """DRF PermissionDenied가 통일된 포맷으로 변환되는지 확인"""
    request = factory.get("/test/")
    response = RaiseDRFPermissionDeniedView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    self.assertEqual(response.data["error_code"], "HTTP_403")


class HandlerDRFNotAuthenticatedTest(TestCase):
  """DRF NotAuthenticated 예외 처리 테스트"""

  def test_drf_not_authenticated_returns_unified_format(self):
    """DRF NotAuthenticated가 통일된 포맷으로 변환되는지 확인"""
    request = factory.get("/test/")
    response = RaiseDRFNotAuthenticatedView.as_view()(request)
    self.assertIn(
      response.status_code,
      [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
    )
    self.assertIn("error_code", response.data)
    self.assertIn("message", response.data)


class HandlerDRFMethodNotAllowedTest(TestCase):
  """DRF MethodNotAllowed 예외 처리 테스트"""

  def test_drf_method_not_allowed_returns_unified_format(self):
    """DRF MethodNotAllowed가 통일된 포맷으로 변환되는지 확인"""
    request = factory.get("/test/")
    response = RaiseDRFMethodNotAllowedView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
    self.assertEqual(response.data["error_code"], "HTTP_405")


class HandlerDRFThrottledTest(TestCase):
  """DRF Throttled 예외 처리 테스트"""

  def test_drf_throttled_returns_unified_format(self):
    """DRF Throttled가 통일된 포맷으로 변환되는지 확인"""
    request = factory.get("/test/")
    response = RaiseDRFThrottledView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
    self.assertIn("error_code", response.data)
    self.assertIn("message", response.data)


class HandlerDRFValidationErrorTest(TestCase):
  """DRF ValidationError 예외 처리 테스트"""

  def test_drf_validation_error_extracts_field_errors(self):
    """DRF ValidationError의 필드별 에러가 field_errors로 변환되는지 확인"""
    request = factory.get("/test/")
    response = RaiseDRFValidationErrorView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(response.data["error_code"], "VALIDATION_ERROR")
    self.assertIn("field_errors", response.data)
    self.assertIn("email", response.data["field_errors"])

  def test_drf_validation_error_non_field_errors(self):
    """DRF ValidationError의 non_field_errors가 message로 변환되는지 확인"""
    request = factory.get("/test/")
    response = RaiseDRFValidationErrorNonFieldView.as_view()(request)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(response.data["message"], "비밀번호가 일치하지 않습니다.")
