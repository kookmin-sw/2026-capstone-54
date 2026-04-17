from achievements.services import ClaimAchievementRewardService
from api.v1.achievements.serializers import AchievementClaimResponseSerializer
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["도전과제"])
class AchievementClaimAPIView(BaseAPIView):
  """달성한 도전과제 보상을 수령한다."""

  serializer_class = AchievementClaimResponseSerializer

  def get_queryset(self):
    return []

  @extend_schema(
    summary="도전과제 보상 수령",
    request=None,
    responses={200: AchievementClaimResponseSerializer},
  )
  def post(self, request, achievement_code):
    user_achievement = ClaimAchievementRewardService(
      user=self.current_user,
      achievement_code=achievement_code,
    ).perform()
    response_data = {
      "achievement_code": user_achievement.achievement.code,
      "reward_claimed_at": user_achievement.reward_claimed_at,
    }
    serializer = AchievementClaimResponseSerializer(response_data)
    return Response(serializer.data, status=status.HTTP_200_OK)
