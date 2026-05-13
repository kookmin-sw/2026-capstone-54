from common.permissions import IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet


class BaseReadOnlyViewSet(ReadOnlyModelViewSet):
  """인증이 필요한 읽기 전용 ViewSet"""

  permission_classes = [IsAuthenticated]
