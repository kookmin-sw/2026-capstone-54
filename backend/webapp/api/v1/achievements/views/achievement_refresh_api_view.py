import structlog
from achievements.constants import (
  TRIGGER_KEY_ACHIEVEMENTS_MANUAL_REFRESH,
  TRIGGER_TYPE_MANUAL_REFRESH,
)
from achievements.services import check_and_mark_manual_refresh
from achievements.tasks import enqueue_evaluate_achievements_task
from api.v1.achievements.serializers import AchievementRefreshResponseSerializer
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response

logger = structlog.get_logger(__name__)


@extend_schema(tags=["도전과제"])
class AchievementRefreshAPIView(BaseAPIView):
  """사용자의 도전과제 달성 상태를 강제 갱신한다."""

  serializer_class = AchievementRefreshResponseSerializer

  def get_queryset(self):
    return []

  @extend_schema(
    summary="도전과제 수동 갱신",
    responses={200: AchievementRefreshResponseSerializer},
  )
  def post(self, request):
    allowed, retry_after_seconds = check_and_mark_manual_refresh(self.current_user.id)
    if not allowed:
      logger.info(
        "achievement_refresh_rate_limited",
        extra={
          "event": "achievement_refresh_rate_limited",
          "user_id": self.current_user.id,
          "trigger_key": TRIGGER_KEY_ACHIEVEMENTS_MANUAL_REFRESH,
          "failure_reason": "manual_refresh_cooldown",
          "retry_after_seconds": retry_after_seconds,
        },
      )
      return Response(
        {
          "error_code": "ACHIEVEMENT_REFRESH_RATE_LIMITED",
          "message": "최근 5분 내에 이미 갱신 요청이 있습니다.",
          "retry_after_seconds": retry_after_seconds,
        },
        status=status.HTTP_429_TOO_MANY_REQUESTS,
      )

    enqueue_evaluate_achievements_task(
      user_id=self.current_user.id,
      trigger_type=TRIGGER_TYPE_MANUAL_REFRESH,
      trigger_key=TRIGGER_KEY_ACHIEVEMENTS_MANUAL_REFRESH,
      context={},
    )
    logger.info(
      "achievement_refresh_accepted",
      extra={
        "event": "achievement_refresh_accepted",
        "user_id": self.current_user.id,
        "trigger_key": TRIGGER_KEY_ACHIEVEMENTS_MANUAL_REFRESH,
        "evaluation_result": True,
      },
    )
    response_data = {"created_achievements_count": 0}
    serializer = AchievementRefreshResponseSerializer(response_data)
    return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
