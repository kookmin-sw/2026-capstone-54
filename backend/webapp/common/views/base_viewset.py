from rest_framework import viewsets

from .base_api_view import BaseAPIView


class BaseViewSet(BaseAPIView, viewsets.ModelViewSet):
  """인증 필수 CRUD ViewSet. BaseAPIView의 인증 정책을 상속받는다."""
  pass
