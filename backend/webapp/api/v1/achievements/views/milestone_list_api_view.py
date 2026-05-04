"""마일스톤 목록 API 뷰."""

from achievements.models import Milestone
from api.v1.achievements.serializers import MilestoneSerializer
from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class MilestoneListAPIView(APIView):
  """마일스톤 목록 조회 API."""

  permission_classes = [IsAuthenticated]

  def get(self, request):
    """마일스톤 목록 조회 (캐싱 적용)."""
    cache_key = f'milestones_user_{request.user.id}'
    cached = cache.get(cache_key)

    if cached:
      return Response(cached, status=status.HTTP_200_OK)

    # 활성 마일스톤 조회 (days 순서로 정렬)
    milestones = Milestone.objects.filter(is_active=True).order_by('condition_payload__rules__0__target')

    serializer = MilestoneSerializer(milestones, many=True, context={'request': request})

    cache.set(cache_key, serializer.data, timeout=300)  # 5분 캐싱

    return Response(serializer.data, status=status.HTTP_200_OK)
