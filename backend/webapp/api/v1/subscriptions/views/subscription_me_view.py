from api.v1.subscriptions.serializers import SubscriptionSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from subscriptions.services import GetCurrentSubscriptionService


@extend_schema(tags=["구독"])
class SubscriptionMeView(BaseAPIView):
  """내 현재 구독 정보 조회."""

  permission_classes = [IsEmailVerified]
  serializer_class = SubscriptionSerializer

  @extend_schema(summary="내 구독 조회")
  def get(self, request):
    """현재 활성 구독을 반환한다. 유료 구독이 있으면 유료를, 없으면 무료를 반환한다."""
    subscription = GetCurrentSubscriptionService(user=self.current_user).perform()
    if subscription is None:
      return Response(
        {"detail": "구독 정보가 없습니다."},
        status=status.HTTP_404_NOT_FOUND,
      )
    return Response(self.get_serializer(subscription).data)
