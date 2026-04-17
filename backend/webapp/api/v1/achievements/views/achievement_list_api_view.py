from achievements.models import Achievement, UserAchievement
from api.v1.achievements.serializers import AchievementListSerializer
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response


@extend_schema(tags=["도전과제"])
class AchievementListAPIView(BaseAPIView):
  """도전과제 목록과 사용자 달성/수령 상태를 반환한다."""

  serializer_class = AchievementListSerializer

  def get_queryset(self):
    return Achievement.objects.filter(is_active=True)

  @extend_schema(
    summary="도전과제 목록 조회",
    responses={200: AchievementListSerializer(many=True)},
  )
  def get(self, request):
    queryset = self.get_queryset()
    user_achievements = UserAchievement.objects.filter(user=self.current_user, achievement__in=queryset)
    user_achievement_by_achievement_id = {item.achievement_id: item for item in user_achievements}

    data = []
    for achievement in queryset:
      user_achievement = user_achievement_by_achievement_id.get(achievement.id)
      data.append(
        {
          "code": achievement.code,
          "name": achievement.name,
          "description": achievement.description,
          "category": achievement.category,
          "is_active": achievement.is_active,
          "starts_at": achievement.starts_at,
          "ends_at": achievement.ends_at,
          "is_achieved": bool(user_achievement),
          "achieved_at": user_achievement.achieved_at if user_achievement else None,
          "reward_claimed_at": user_achievement.reward_claimed_at if user_achievement else None,
          "can_claim_reward": bool(user_achievement and user_achievement.reward_claimed_at is None),
        }
      )
    serializer = AchievementListSerializer(data, many=True)
    return Response(serializer.data)
