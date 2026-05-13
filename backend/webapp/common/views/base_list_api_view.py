from common.permissions import IsAuthenticated
from rest_framework import generics


class BaseListAPIView(generics.ListAPIView):
  """인증이 필요한 목록 조회 뷰 베이스 클래스"""

  permission_classes = [IsAuthenticated]
