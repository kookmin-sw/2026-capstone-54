from common.permissions import AllowAny
from rest_framework import generics


class PublicBaseListAPIView(generics.ListAPIView):
  """비로그인 사용자도 접근 가능한 목록 조회 뷰 베이스 클래스"""

  permission_classes = [AllowAny]
