from rest_framework.permissions import AllowAny
from rest_framework.viewsets import ReadOnlyModelViewSet


class BaseReadOnlyViewSet(ReadOnlyModelViewSet):
  """비로그인 사용자도 접근 가능한 읽기 전용 ViewSet"""
  permission_classes = [AllowAny]
