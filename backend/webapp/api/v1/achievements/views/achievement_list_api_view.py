from achievements.models import Achievement, UserAchievement
from api.v1.achievements.serializers import AchievementListSerializer
from common.views import BaseAPIView
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.response import Response


@extend_schema(tags=["도전과제"])
class AchievementListAPIView(BaseAPIView):
  """도전과제 목록과 사용자 달성/수령 상태를 반환한다. 페이지네이션 및 필터링 지원."""

  serializer_class = AchievementListSerializer

  def get_queryset(self):
    return Achievement.objects.filter(is_active=True)

  @extend_schema(
    summary="도전과제 목록 조회 (페이지네이션 + 필터)",
    parameters=[
      OpenApiParameter(name="limit", type=int, description="페이지 크기 (기본 20, 최대 100)"),
      OpenApiParameter(name="offset", type=int, description="시작 위치 (기본 0)"),
      OpenApiParameter(name="category", type=str, description="카테고리 필터 (streak, profile, interview, activity, other)"),
      OpenApiParameter(name="status", type=str, description="달성 여부 필터 (achieved, unachieved)"),
      OpenApiParameter(name="reward_claim", type=str, description="보상 수령 필터 (claimed, unclaimed)"),
    ],
    responses={200: AchievementListSerializer(many=True)},
  )
  def get(self, request):
    queryset = self.get_queryset()

    # 카테고리 필터
    category = request.query_params.get("category")
    if category:
      queryset = queryset.filter(category=category)

    # 사용자 달성 정보 조회 (한 번에)
    user_achievements = UserAchievement.objects.filter(
      user=self.current_user,
      achievement__in=queryset,
    )
    user_achievement_by_achievement_id = {item.achievement_id: item for item in user_achievements}
    achieved_ids = set(user_achievement_by_achievement_id.keys())

    # 달성 여부 필터
    status_filter = request.query_params.get("status")
    if status_filter == "achieved":
      queryset = queryset.filter(id__in=achieved_ids)
    elif status_filter == "unachieved":
      queryset = queryset.exclude(id__in=achieved_ids)

    # 보상 수령 필터
    reward_claim = request.query_params.get("reward_claim")
    if reward_claim == "claimed":
      claimed_ids = {aid for aid, ua in user_achievement_by_achievement_id.items() if ua.reward_claimed_at is not None}
      queryset = queryset.filter(id__in=claimed_ids)
    elif reward_claim == "unclaimed":
      unclaimed_ids = {aid for aid, ua in user_achievement_by_achievement_id.items() if ua.reward_claimed_at is None}
      queryset = queryset.filter(id__in=unclaimed_ids)

    # 정렬
    queryset = queryset.order_by("-created_at")

    # 전체 개수
    total = queryset.count()

    # 페이지네이션
    limit = min(int(request.query_params.get("limit", 20)), 100)
    offset = int(request.query_params.get("offset", 0))
    page_queryset = queryset[offset:offset + limit]

    # 필터 후 user_achievement 재조회 (페이지 범위)
    data = []
    for achievement in page_queryset:
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
    return Response({
      "results": serializer.data,
      "total": total,
      "limit": limit,
      "offset": offset,
    })
