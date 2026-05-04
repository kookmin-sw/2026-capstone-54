"""마일스톤 Serializer 테스트."""

from achievements.enums import AchievementCategory, AchievementConditionType
from achievements.models import Milestone, UserAchievement
from api.v1.achievements.serializers import MilestoneSerializer
from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase

User = get_user_model()


class MilestoneSerializerTests(TestCase):
  """마일스톤 Serializer 테스트."""

  def setUp(self):
    """테스트 설정."""
    self.factory = RequestFactory()
    self.user = User.objects.create_user(email='test@example.com', password='testpass123')

  def test_get_days_extracts_from_condition_payload(self):
    """days 추출 로직 검증."""
    milestone = Milestone.objects.create(
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

    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertEqual(serializer.data['days'], 7)

  def test_get_reward_formats_ticket_reward(self):
    """보상 포맷팅 검증."""
    milestone = Milestone.objects.create(
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

    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertEqual(serializer.data['reward'], "티켓 7개")

  def test_get_status_achieved_when_user_has_achievement(self):
    """사용자가 달성한 마일스톤 상태 검증."""
    milestone = Milestone.objects.create(
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
    UserAchievement.objects.create(user=self.user, achievement=milestone)

    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertEqual(serializer.data['status'], 'achieved')

  def test_get_status_next_when_user_has_not_achieved(self):
    """사용자가 달성하지 못한 마일스톤 상태 검증."""
    milestone = Milestone.objects.create(
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

    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertEqual(serializer.data['status'], 'next')

  def test_get_status_locked_for_unauthenticated_user(self):
    """인증되지 않은 사용자의 마일스톤 상태 검증."""
    milestone = Milestone.objects.create(
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

    request = self.factory.get('/')
    request.user = None
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertEqual(serializer.data['status'], 'locked')

  def test_conditional_field_inclusion_achieved_status(self):
    """achieved 상태일 때 rewardIcon 제거 검증."""
    milestone = Milestone.objects.create(
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
    UserAchievement.objects.create(user=self.user, achievement=milestone)

    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertNotIn('rewardIcon', serializer.data)

  def test_conditional_field_inclusion_locked_status(self):
    """locked 상태일 때 daysRemaining 제거 검증."""
    milestone = Milestone.objects.create(
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

    request = self.factory.get('/')
    request.user = None
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertNotIn('daysRemaining', serializer.data)
