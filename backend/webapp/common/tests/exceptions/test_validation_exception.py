from common.exceptions import ValidationException
from django.test import TestCase
from rest_framework import status


class ValidationExceptionTest(TestCase):
  """ValidationException 테스트"""

  def test_default_status_code(self):
    """기본 status_code가 400인지 확인"""
    exc = ValidationException()
    self.assertEqual(exc.status_code, status.HTTP_400_BAD_REQUEST)

  def test_default_error_code(self):
    """기본 error_code가 VALIDATION_ERROR인지 확인"""
    exc = ValidationException()
    self.assertEqual(exc.error_code, "VALIDATION_ERROR")

  def test_field_errors_included_in_response(self):
    """field_errors가 응답 데이터에 포함되는지 확인"""
    exc = ValidationException(field_errors={"title": ["제목은 필수입니다."]})
    data = exc.to_response_data()
    self.assertIn("field_errors", data)
    self.assertEqual(data["field_errors"]["title"], ["제목은 필수입니다."])

  def test_empty_field_errors_excluded_from_response(self):
    """field_errors가 비어있으면 응답에서 제외되는지 확인"""
    exc = ValidationException()
    data = exc.to_response_data()
    self.assertNotIn("field_errors", data)

  def test_multiple_field_errors(self):
    """여러 필드의 에러가 정상 반환되는지 확인"""
    exc = ValidationException(
      field_errors={
        "title": ["제목은 필수입니다."],
        "content": ["내용은 100자 이상이어야 합니다.", "HTML 태그는 허용되지 않습니다."],
      }
    )
    data = exc.to_response_data()
    self.assertEqual(len(data["field_errors"]), 2)
    self.assertEqual(len(data["field_errors"]["content"]), 2)
