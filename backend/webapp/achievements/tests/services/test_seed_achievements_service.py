"""Seed 서비스 테스트."""

from achievements.enums import AchievementCategory
from achievements.models import Milestone
from achievements.services import SeedAchievementsService
from django.test import TestCase


class SeedAchievementsServiceTests(TestCase):
  """Seed 서비스 테스트."""

  def test_seed_creates_all_milestones(self):
    """모든 마일스톤 생성 검증."""
    result = SeedAchievementsService.seed()

    # 기본 업적 5개 + 마일스톤 6개 = 11개
    self.assertEqual(result['created'], 11)

    # 마일스톤 확인
    milestones = Milestone.objects.all()
    self.assertEqual(milestones.count(), 6)

  def test_seed_creates_milestone_with_correct_code_pattern(self):
    """마일스톤 코드 패턴 검증."""
    SeedAchievementsService.seed()

    expected_codes = [
      "streak_3_days",
      "streak_7_days",
      "streak_14_days",
      "streak_30_days",
      "streak_60_days",
      "streak_100_days",
    ]

    for code in expected_codes:
      milestone = Milestone.objects.get(code=code)
      self.assertIsNotNone(milestone)

  def test_seed_creates_milestone_with_correct_name_pattern(self):
    """마일스톤 이름 패턴 검증."""
    SeedAchievementsService.seed()

    expected_names = [
      "3일 연속 출석",
      "7일 연속 출석",
      "14일 연속 출석",
      "30일 연속 출석",
      "60일 연속 출석",
      "100일 연속 출석",
    ]

    for name in expected_names:
      milestone = Milestone.objects.get(name=name)
      self.assertIsNotNone(milestone)

  def test_seed_creates_milestone_with_streak_category(self):
    """마일스톤 카테고리 검증."""
    SeedAchievementsService.seed()

    milestones = Milestone.objects.all()
    for milestone in milestones:
      self.assertEqual(milestone.category, AchievementCategory.STREAK)

  def test_seed_creates_milestone_with_correct_condition_payload(self):
    """마일스톤 condition_payload 검증."""
    SeedAchievementsService.seed()

    milestone = Milestone.objects.get(code="streak_7_days")
    payload = milestone.condition_payload

    self.assertEqual(payload['type'], 'group')
    self.assertEqual(payload['logic'], 'AND')
    self.assertEqual(len(payload['rules']), 1)
    self.assertEqual(payload['rules'][0]['type'], 'metric_threshold')
    self.assertEqual(payload['rules'][0]['metric_key'], 'streak.current_days')
    self.assertEqual(payload['rules'][0]['operator'], '>=')
    self.assertEqual(payload['rules'][0]['target'], 7)

  def test_seed_creates_milestone_with_correct_reward_payload(self):
    """마일스톤 reward_payload 검증."""
    SeedAchievementsService.seed()

    milestone = Milestone.objects.get(code="streak_7_days")
    payload = milestone.reward_payload

    self.assertEqual(payload['type'], 'ticket')
    self.assertEqual(payload['amount'], 7)

  def test_seed_is_idempotent(self):
    """Seed 서비스 멱등성 검증."""
    result1 = SeedAchievementsService.seed()
    result2 = SeedAchievementsService.seed()

    # 첫 번째 실행: 11개 생성
    self.assertEqual(result1['created'], 11)
    self.assertEqual(result1['skipped'], 0)

    # 두 번째 실행: 0개 생성, 11개 스킵
    self.assertEqual(result2['created'], 0)
    self.assertEqual(result2['skipped'], 11)

    # 마일스톤 개수 확인
    milestones = Milestone.objects.all()
    self.assertEqual(milestones.count(), 6)

  def test_seed_creates_milestone_with_correct_reward_amounts(self):
    """마일스톤 보상 금액 검증."""
    SeedAchievementsService.seed()

    expected_rewards = {
      "streak_3_days": 3,
      "streak_7_days": 7,
      "streak_14_days": 14,
      "streak_30_days": 30,
      "streak_60_days": 60,
      "streak_100_days": 100,
    }

    for code, expected_amount in expected_rewards.items():
      milestone = Milestone.objects.get(code=code)
      self.assertEqual(milestone.reward_payload['amount'], expected_amount)
