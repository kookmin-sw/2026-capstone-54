"""마일스톤 API 테스트."""

from achievements.enums import AchievementCategory, AchievementConditionType
from achievements.models import Milestone
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()


class MilestoneListAPIViewTests(TestCase):
  """마일스톤 API 테스트."""

  def setUp(self):
    """테스트 설정."""
    self.client = APIClient()
    self.user = User.objects.create_user(email='test@example.com', password='testpass123')

  def test_api_returns_200_for_authenticated_user(self):
    """인증된 사용자에게 200 응답 반환."""
    self.client.force_authenticate(user=self.user)
    response = self.client.get('/api/v1/achievements/milestones/')
    self.assertEqual(response.status_code, 200)

  def test_api_returns_401_for_unauthenticated_user(self):
    """인증되지 않은 사용자에게 401 응답 반환."""
    response = self.client.get('/api/v1/achievements/milestones/')
    self.assertEqual(response.status_code, 401)

  def test_api_returns_milestone_list(self):
    """마일스톤 목록 반환."""
    # 마일스톤 생성
    Milestone.objects.create(
      code="streak_3_days",
      name="3일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 3,
        }],
      },
      reward_payload={
        "type": "ticket",
        "amount": 3
      },
      is_active=True,
    )

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
      is_active=True,
    )

    self.client.force_authenticate(user=self.user)
    response = self.client.get('/api/v1/achievements/milestones/')

    self.assertEqual(response.status_code, 200)
    self.assertEqual(len(response.data), 2)

  def test_api_returns_milestones_sorted_by_days(self):
    """마일스톤이 days 순서로 정렬되어 반환."""
    # 역순으로 마일스톤 생성
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
      is_active=True,
    )

    Milestone.objects.create(
      code="streak_3_days",
      name="3일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 3,
        }],
      },
      reward_payload={
        "type": "ticket",
        "amount": 3
      },
      is_active=True,
    )

    self.client.force_authenticate(user=self.user)
    response = self.client.get('/api/v1/achievements/milestones/')

    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data[0]['days'], 3)
    self.assertEqual(response.data[1]['days'], 7)

  def test_api_returns_only_active_milestones(self):
    """활성 마일스톤만 반환."""
    # 활성 마일스톤
    Milestone.objects.create(
      code="streak_3_days",
      name="3일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [{
          "type": "metric_threshold",
          "metric_key": "streak.current_days",
          "operator": ">=",
          "target": 3,
        }],
      },
      reward_payload={
        "type": "ticket",
        "amount": 3
      },
      is_active=True,
    )

    # 비활성 마일스톤
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
      is_active=False,
    )

    self.client.force_authenticate(user=self.user)
    response = self.client.get('/api/v1/achievements/milestones/')

    self.assertEqual(response.status_code, 200)
    self.assertEqual(len(response.data), 1)
    self.assertEqual(response.data[0]['days'], 3)

  def test_api_response_includes_required_fields(self):
    """API 응답에 필수 필드 포함."""
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
      is_active=True,
    )

    self.client.force_authenticate(user=self.user)
    response = self.client.get('/api/v1/achievements/milestones/')

    self.assertEqual(response.status_code, 200)
    data = response.data[0]
    self.assertIn('id', data)
    self.assertIn('days', data)
    self.assertIn('name', data)
    self.assertIn('description', data)
    self.assertIn('reward', data)
    self.assertIn('status', data)
