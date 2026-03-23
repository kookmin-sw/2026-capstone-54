"""
Swagger 문서용 에러 응답 Serializer.
"""

from rest_framework import serializers


class ErrorResponseSerializer(serializers.Serializer):
  """공통 에러 응답"""
  error_code = serializers.CharField(help_text="에러 코드")
  message = serializers.CharField(help_text="에러 메시지")


class ValidationErrorResponseSerializer(serializers.Serializer):
  """유효성 검증 에러 응답"""
  error_code = serializers.CharField(help_text="에러 코드")
  message = serializers.CharField(help_text="에러 메시지")
  field_errors = serializers.DictField(
    child=serializers.ListField(child=serializers.CharField()),
    help_text="필드별 에러 목록",
    required=False,
  )
