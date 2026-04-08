from rest_framework import generics
from rest_framework.permissions import AllowAny


class BaseListAPIView(generics.ListAPIView):
  """목록 조회 뷰 베이스 클래스"""
  permission_classes = [AllowAny]
