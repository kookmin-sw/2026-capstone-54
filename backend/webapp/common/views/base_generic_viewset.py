from .base_api_view import BaseAPIView
from rest_framework import viewsets


class BaseGenericViewSet(BaseAPIView, viewsets.GenericViewSet):
  """인증 필수 커스텀 액션 ViewSet. 기본 CRUD 없이 @action으로 엔드포인트를 정의할 때 사용한다."""
  pass
