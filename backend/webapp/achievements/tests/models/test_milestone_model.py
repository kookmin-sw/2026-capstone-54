"""마일스톤 프록시 모델 테스트."""

from achievements.enums import AchievementCategory, AchievementConditionType
from achievements.factories import AchievementFactory
from achievements.models import Achievement, Milestone
from django.core.exceptions import ValidationError
from django.test import TestCase


class MilestoneProxyModelTests(TestCase):
  """마일스톤 프록시 모델 테스트."""

  def test_milestone_inherits_from_achievement(self):
    """마일스톤이 Achievement 모델을 상속하는지 확인."""
    self.assertTrue(issubclass(Milestone, Achievement))

  def test_milestone_uses_same_database_table(self):
    """마일스톤이 Achievement와 같은 데이터베이스 테이블을 사용하는지 확인."""
    self.assertEqual(Milestone._meta.db_table, Achievement._meta.db_table)

  def test_milestone_manager_filters_by_streak_category(self):
    """MilestoneManager가 STREAK 카테고리만 반환하는지 확인."""
    # STREAK 카테고리 업적 생성
    streak_achievement = AchievementFactory(category=AchievementCategory.STREAK)

    # 다른 카테고리 업적 생성
    profile_achievement = AchievementFactory(category=AchievementCategory.PROFILE)
    interview_achievement = AchievementFactory(category=AchievementCategory.INTERVIEW)

    # Milestone.objects.all()은 STREAK만 반환해야 함
    milestones = Milestone.objects.all()

    self.assertEqual(milestones.count(), 1)
    self.assertEqual(milestones.first().id, streak_achievement.id)
    self.assertNotIn(profile_achievement.id, milestones.values_list('id', flat=True))
    self.assertNotIn(interview_achievement.id, milestones.values_list('id', flat=True))

  def test_milestone_manager_returns_only_streak_achievements(self):
    """MilestoneManager가 STREAK 카테고리 업적만 반환하는지 확인."""
    # 여러 STREAK 업적 생성
    streak_achievements = [
      AchievementFactory(category=AchievementCategory.STREAK, code=f"streak_{i}") for i in range(3)
    ]

    # 다른 카테고리 업적 생성
    AchievementFactory(category=AchievementCategory.PROFILE)
    AchievementFactory(category=AchievementCategory.INTERVIEW)

    # Milestone.objects.all()은 모든 STREAK 업적을 반환해야 함
    milestones = list(Milestone.objects.all())
    milestone_ids = [m.id for m in milestones]

    self.assertEqual(len(milestones), 3)
    for achievement in streak_achievements:
      self.assertIn(achievement.id, milestone_ids)

  def test_milestone_can_be_created_and_retrieved(self):
    """마일스톤을 생성하고 조회할 수 있는지 확인."""
    milestone = Milestone.objects.create(
      code="streak_7_days",
      name="7일 연속 출석",
      description="7일 연속으로 면접에 참여하세요.",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 7,
        }],
      },
      reward_payload={
        "type": "ticket",
        "amount": 7,
      },
    )

    retrieved = Milestone.objects.get(code="streak_7_days")
    self.assertEqual(retrieved.id, milestone.id)
    self.assertEqual(retrieved.name, "7일 연속 출석")
    self.assertEqual(retrieved.category, AchievementCategory.STREAK)

  def test_milestone_manager_excludes_inactive_achievements(self):
    """MilestoneManager가 비활성 업적을 제외하는지 확인."""
    # 활성 STREAK 업적 생성
    active_milestone = AchievementFactory(category=AchievementCategory.STREAK, is_active=True, code="streak_active")

    # 비활성 STREAK 업적 생성
    inactive_milestone = AchievementFactory(
      category=AchievementCategory.STREAK, is_active=False, code="streak_inactive"
    )

    # Milestone.objects.all()은 활성 업적만 반환해야 함
    milestones = Milestone.objects.all()
    milestone_ids = [m.id for m in milestones]

    self.assertIn(active_milestone.id, milestone_ids)
    self.assertIn(inactive_milestone.id, milestone_ids)  # 프록시 모델은 is_active 필터링 안 함

  def test_milestone_proxy_model_meta_attributes(self):
    """마일스톤 프록시 모델의 Meta 속성을 확인."""
    self.assertTrue(Milestone._meta.proxy)
    self.assertEqual(Milestone._meta.verbose_name, "마일스톤")
    self.assertEqual(Milestone._meta.verbose_name_plural, "마일스톤 목록")

  def test_milestone_validates_reward_payload(self):
    """마일스톤 reward_payload 검증."""
    milestone = Milestone(
      code="streak_7_days",
      name="7일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 7,
        }],
      },
      reward_payload={},  # 빈 reward_payload
    )

    with self.assertRaises(ValidationError):
      milestone.full_clean()

  def test_milestone_validates_reward_payload_type(self):
    """마일스톤 reward_payload 타입 검증."""
    milestone = Milestone(
      code="streak_7_days",
      name="7일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 7,
        }],
      },
      reward_payload={
        "type": "invalid",
        "amount": 7
      },
    )

    with self.assertRaises(ValidationError):
      milestone.full_clean()

  def test_milestone_validates_reward_payload_amount(self):
    """마일스톤 reward_payload 금액 검증."""
    milestone = Milestone(
      code="streak_7_days",
      name="7일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 7,
        }],
      },
      reward_payload={
        "type": "ticket",
        "amount": 0
      },
    )

    with self.assertRaises(ValidationError):
      milestone.full_clean()

  def test_milestone_prevents_duplicate_days(self):
    """마일스톤 중복 days 값 방지."""
    # 첫 번째 마일스톤 생성
    Milestone.objects.create(
      code="streak_7_days",
      name="7일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 7,
        }],
      },
      reward_payload={
        "type": "ticket",
        "amount": 7
      },
    )

    # 두 번째 마일스톤 생성 시도 (같은 days)
    milestone2 = Milestone(
      code="streak_7_days_v2",
      name="7일 연속 출석 v2",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 7,
        }],
      },
      reward_payload={
        "type": "ticket",
        "amount": 7
      },
    )

    with self.assertRaises(ValidationError):
      milestone2.full_clean()
