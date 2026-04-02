import logging
from datetime import timedelta

from common.services import BaseService
from django.contrib.auth import get_user_model
from django.db.models import Prefetch, prefetch_related_objects
from django.utils import timezone
from streaks.models import StreakLog, StreakStatistics

User = get_user_model()
logger = logging.getLogger(__name__)


class RecalculateStreakStatisticsService(BaseService):
  """StreakLog 데이터를 기반으로 스트릭 통계를 재계산한다.

  Usage:
    # 단일 사용자
    RecalculateStreakStatisticsService(user=user).perform()

    # 다중 사용자 (User 객체 직접 전달)
    RecalculateStreakStatisticsService(users=[user1, user2]).perform()

    # 다중 사용자 (user_ids 전달)
    RecalculateStreakStatisticsService(user_ids=[1, 2, 3]).perform()
  """

  def execute(self):
    # 단일 사용자 처리
    if self.user:
      user = self._prefetch_user_logs(self.user)
      streak_statistic = self._get_or_initialize_streak_statistic(user)
      streak_statistic = self._prepare_streak_statistic(user, streak_statistic)
      streak_statistic.updated_at = timezone.now()
      streak_statistic.save(update_fields=["current_streak", "longest_streak", "last_participated_date", "updated_at"])
      return streak_statistic

    # 다중 사용자 처리
    users = self.kwargs.get("users")
    user_ids = self.kwargs.get("user_ids")

    if users is not None:
      # User 객체가 직접 전달된 경우
      users_with_prefetch = self._add_prefetch_to_users(users)
    elif user_ids is not None:
      # user_ids가 전달된 경우
      users_with_prefetch = self._get_users_with_prefetch(user_ids)
    else:
      raise ValueError("Either 'users' or 'user_ids' must be provided")

    return self._recalculate_multiple_users(users_with_prefetch)

  def _prefetch_user_logs(self, user):
    """단일 사용자에 대해 StreakLog를 prefetch한다"""
    prefetch_related_objects([user], Prefetch("streak_logs", queryset=StreakLog.objects.order_by("date")))
    return user

  def _add_prefetch_to_users(self, users):
    """이미 조회된 User 객체들에 prefetch를 추가한다"""
    prefetch_related_objects(
      users, Prefetch("streak_logs", queryset=StreakLog.objects.order_by("date")), "streak_statistic"
    )

    return users

  def _get_users_with_prefetch(self, user_ids):
    """다중 사용자에 대해 StreakLog와 StreakStatistics를 prefetch한다"""
    users = User.objects.filter(id__in=user_ids)

    return users.prefetch_related(
      Prefetch("streak_logs", queryset=StreakLog.objects.order_by("date")), "streak_statistic"
    )

  def _recalculate_multiple_users(self, users):
    """다중 사용자의 스트릭 통계를 재계산한다"""
    results = {"success_count": 0, "error_count": 0, "updated_stats": []}

    statistics_to_update = []
    statistics_to_create = []

    for user in users:
      try:
        streak_statistic = self._get_or_initialize_streak_statistic(user)
        streak_statistic = self._prepare_streak_statistic(user, streak_statistic)

        if streak_statistic.pk:
          # 기존 레코드 업데이트 대상
          statistics_to_update.append(streak_statistic)
        else:
          # 신규 레코드 생성 대상
          statistics_to_create.append(streak_statistic)

        results["success_count"] += 1
        results["updated_stats"].append(streak_statistic)
      except Exception as error:
        results["error_count"] += 1
        logger.error(f"Failed to recalculate statistics for user {user.id}: {error}")
        continue

    # Bulk 저장
    if statistics_to_create:
      StreakStatistics.objects.bulk_create(statistics_to_create)

    if statistics_to_update:
      # bulk_update는 auto_now를 자동 갱신하지 않으므로 명시적으로 설정
      current_time = timezone.now()
      for stat in statistics_to_update:
        stat.updated_at = current_time

      StreakStatistics.objects.bulk_update(
        statistics_to_update, fields=["current_streak", "longest_streak", "last_participated_date", "updated_at"]
      )

    return results

  def _get_or_initialize_streak_statistic(self, user):
    """사용자의 StreakStatistics를 가져오거나 새 객체를 생성한다"""
    try:
      return user.streak_statistic
    except StreakStatistics.DoesNotExist:
      return StreakStatistics(user=user)

  def _prepare_streak_statistic(self, user, streak_statistic):
    """단일 사용자의 스트릭 통계를 계산한다 (저장하지 않음)"""
    streak_logs = list(user.streak_logs.all())

    if not streak_logs:
      # 로그가 없으면 초기화
      streak_statistic.current_streak = 0
      streak_statistic.longest_streak = 0
      streak_statistic.last_participated_date = None
      return streak_statistic

    # 연속 일수 계산
    current_streak = 1
    longest_streak = 1
    last_date = streak_logs[0].date

    for streak_log in streak_logs[1:]:
      if streak_log.date == last_date + timedelta(days=1):
        # 연속된 날짜
        current_streak += 1
        longest_streak = max(longest_streak, current_streak)
      elif streak_log.date > last_date + timedelta(days=1):
        # 연속이 끊김
        current_streak = 1
      # streak_log.date == last_date인 경우는 중복 (발생하지 않아야 함)
      last_date = streak_log.date

    # 마지막 참여일이 어제 또는 오늘이 아니면 current_streak은 0
    today = timezone.localdate()
    yesterday = today - timedelta(days=1)
    if last_date not in (today, yesterday):
      current_streak = 0

    streak_statistic.current_streak = current_streak
    streak_statistic.longest_streak = longest_streak
    streak_statistic.last_participated_date = last_date

    return streak_statistic
