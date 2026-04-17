"""업적 시드 데이터 생성 서비스."""

from achievements.enums import AchievementCategory, AchievementConditionType
from achievements.models import Achievement
from django.db import transaction


class SeedAchievementsService:
  """기본 업적 데이터를 생성한다. 이미 존재하는 code는 건너뛴다."""

  DEFAULT_ACHIEVEMENTS = [
    {
      "code": "complete_profile_once",
      "name": "프로필 완성",
      "description": "프로필을 처음으로 완성하세요.",
      "category": AchievementCategory.PROFILE,
      "condition_type": AchievementConditionType.RULE_GROUP,
      "condition_payload": {
        "type": "field_exists",
        "field_path": "users.profile_completed_at",
        "exists": True,
      },
      "reward_payload": {
        "type": "ticket",
        "amount": 2
      },
    },
    {
      "code": "first_interview",
      "name": "첫 면접 도전",
      "description": "면접을 1회 완료하세요.",
      "category": AchievementCategory.INTERVIEW,
      "condition_type": AchievementConditionType.RULE_GROUP,
      "condition_payload": {
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "interview.total_count",
          "operator": ">=",
          "target": 1,
        }],
      },
      "reward_payload": {
        "type": "ticket",
        "amount": 3
      },
    },
    {
      "code": "interview_5_times",
      "name": "면접 5회 달성",
      "description": "면접을 5회 완료하세요.",
      "category": AchievementCategory.INTERVIEW,
      "condition_type": AchievementConditionType.RULE_GROUP,
      "condition_payload": {
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "interview.total_count",
          "operator": ">=",
          "target": 5,
        }],
      },
      "reward_payload": {
        "type": "ticket",
        "amount": 5
      },
    },
    {
      "code": "streak_3_days",
      "name": "3일 연속 출석",
      "description": "3일 연속으로 면접에 참여하세요.",
      "category": AchievementCategory.STREAK,
      "condition_type": AchievementConditionType.RULE_GROUP,
      "condition_payload": {
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 3,
        }],
      },
      "reward_payload": {
        "type": "ticket",
        "amount": 3
      },
    },
    {
      "code": "streak_7_days",
      "name": "7일 연속 출석",
      "description": "7일 연속으로 면접에 참여하세요.",
      "category": AchievementCategory.STREAK,
      "condition_type": AchievementConditionType.RULE_GROUP,
      "condition_payload": {
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 7,
        }],
      },
      "reward_payload": {
        "type": "ticket",
        "amount": 7
      },
    },
  ]

  @classmethod
  @transaction.atomic
  def seed(cls) -> dict:
    """기본 업적 데이터를 생성하고 결과를 반환한다."""
    created_count = 0
    skipped_count = 0

    for data in cls.DEFAULT_ACHIEVEMENTS:
      _, created = Achievement.objects.get_or_create(
        code=data["code"],
        defaults={
          "name": data["name"],
          "description": data["description"],
          "category": data["category"],
          "condition_type": data["condition_type"],
          "condition_payload": data["condition_payload"],
          "reward_payload": data["reward_payload"],
        },
      )
      if created:
        created_count += 1
      else:
        skipped_count += 1

    return {"created": created_count, "skipped": skipped_count}
