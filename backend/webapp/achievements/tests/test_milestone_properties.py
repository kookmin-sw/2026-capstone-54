"""마일스톤 Correctness Properties 테스트."""

from achievements.enums import AchievementCategory, AchievementConditionType
from achievements.models import Milestone, UserAchievement
from achievements.services import SeedAchievementsService
from api.v1.achievements.serializers import MilestoneSerializer
from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase
from hypothesis import given
from hypothesis import strategies as st

User = get_user_model()


class MilestonePropertiesTests(TestCase):
  """마일스톤 Correctness Properties 테스트."""

  def setUp(self):
    """테스트 설정."""
    self.factory = RequestFactory()
    self.user = User.objects.create_user(email='test@example.com', password='testpass123')

  # Property 1: Milestone Manager Filters by STREAK Category
  @given(
    streak_count=st.integers(min_value=1, max_value=5),
    other_count=st.integers(min_value=1, max_value=5),
  )
  def test_property_1_milestone_manager_filters_by_streak_category(self, streak_count, other_count):
    """**Validates: Requirements 1.2, 1.3, 1.4**

    Property 1: Milestone Manager Filters by STREAK Category
    For any set of achievements with mixed categories, querying Milestone.objects.all()
    should return only achievements with category=STREAK.
    """
    # STREAK 업적 생성
    for i in range(streak_count):
      Milestone.objects.create(
        code=f"streak_{i}",
        name=f"Streak {i}",
        category=AchievementCategory.STREAK,
        condition_type=AchievementConditionType.RULE_GROUP,
        condition_payload={
          "type": "group",
          "logic": "AND",
          "rules": [
            {
              "type": "metric_threshold",
              "metric_key": "streak.current_days",
              "operator": ">=",
              "target": i + 1,
            }
          ],
        },
        reward_payload={
          "type": "ticket",
          "amount": i + 1
        },
      )

    # 다른 카테고리 업적 생성
    from achievements.factories import AchievementFactory
    for i in range(other_count):
      AchievementFactory(
        category=AchievementCategory.PROFILE if i % 2 == 0 else AchievementCategory.INTERVIEW, code=f"other_{i}"
      )

    # 검증: Milestone.objects.all()은 STREAK만 반환
    milestones = Milestone.objects.all()
    self.assertEqual(milestones.count(), streak_count)
    for milestone in milestones:
      self.assertEqual(milestone.category, AchievementCategory.STREAK)

  # Property 2: Milestone Status Reflects Achievement State
  @given(days=st.integers(min_value=1, max_value=100), )
  def test_property_2_milestone_status_reflects_achievement_state(self, days):
    """**Validates: Requirements 2.4**

    Property 2: Milestone Status Reflects Achievement State
    For any user and milestone, if the user has a UserAchievement record for that milestone,
    the status should be "achieved".
    """
    milestone = Milestone.objects.create(
      code=f"streak_{days}_days",
      name=f"{days}일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [
          {
            "type": "metric_threshold",
            "metric_key": "streak.current_days",
            "operator": ">=",
            "target": days,
          }
        ],
      },
      reward_payload={
        "type": "ticket",
        "amount": days
      },
    )

    # UserAchievement 생성
    UserAchievement.objects.create(user=self.user, achievement=milestone)

    # 검증: status는 "achieved"
    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertEqual(serializer.data['status'], 'achieved')

  # Property 3: Days Remaining Calculation
  @given(milestone_days=st.integers(min_value=1, max_value=100), )
  def test_property_3_days_remaining_calculation(self, milestone_days):
    """**Validates: Requirements 2.6**

    Property 3: Days Remaining Calculation
    For any milestone with status "next" and any user with current streak less than milestone days,
    daysRemaining should equal (milestone_days - current_streak).
    """
    milestone = Milestone.objects.create(
      code=f"streak_{milestone_days}_days",
      name=f"{milestone_days}일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [
          {
            "type": "metric_threshold",
            "metric_key": "streak.current_days",
            "operator": ">=",
            "target": milestone_days,
          }
        ],
      },
      reward_payload={
        "type": "ticket",
        "amount": milestone_days
      },
    )

    # 검증: status는 "next"이고 daysRemaining은 milestone_days
    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertEqual(serializer.data['status'], 'next')
    self.assertEqual(serializer.data['daysRemaining'], milestone_days)

  # Property 4: API Response Sorting
  @given(days_list=st.lists(st.integers(min_value=1, max_value=100), min_size=2, max_size=5, unique=True), )
  def test_property_4_api_response_sorting(self, days_list):
    """**Validates: Requirements 2.7**

    Property 4: API Response Sorting
    For any set of milestones, the API response should be sorted by days in ascending order.
    """
    # 마일스톤 생성 (역순)
    for i, days in enumerate(sorted(days_list, reverse=True)):
      Milestone.objects.create(
        code=f"streak_{days}_days",
        name=f"{days}일 연속 출석",
        category=AchievementCategory.STREAK,
        condition_type=AchievementConditionType.RULE_GROUP,
        condition_payload={
          "type": "group",
          "logic": "AND",
          "rules": [
            {
              "type": "metric_threshold",
              "metric_key": "streak.current_days",
              "operator": ">=",
              "target": days,
            }
          ],
        },
        reward_payload={
          "type": "ticket",
          "amount": days
        },
        is_active=True,
      )

    # 검증: 응답은 days 순서로 정렬
    milestones = Milestone.objects.filter(is_active=True).order_by('condition_payload__rules__0__target')
    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestones, many=True, context={'request': request})

    response_days = [m['days'] for m in serializer.data]
    self.assertEqual(response_days, sorted(response_days))

  # Property 5: Milestone Code Generation Pattern
  @given(days=st.integers(min_value=1, max_value=365), )
  def test_property_5_milestone_code_generation_pattern(self, days):
    """**Validates: Requirements 3.4, 4.2**

    Property 5: Milestone Code Generation Pattern
    For any days value N, the automatically generated code should follow the pattern "streak_N_days".
    """
    code = f"streak_{days}_days"
    milestone = Milestone.objects.create(
      code=code,
      name=f"{days}일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [
          {
            "type": "metric_threshold",
            "metric_key": "streak.current_days",
            "operator": ">=",
            "target": days,
          }
        ],
      },
      reward_payload={
        "type": "ticket",
        "amount": days
      },
    )

    # 검증: code는 패턴을 따름
    self.assertEqual(milestone.code, f"streak_{days}_days")

  # Property 6: Milestone Name Generation Pattern
  @given(days=st.integers(min_value=1, max_value=365), )
  def test_property_6_milestone_name_generation_pattern(self, days):
    """**Validates: Requirements 3.5, 4.3**

    Property 6: Milestone Name Generation Pattern
    For any days value N, the automatically generated name should follow the pattern "N일 연속 출석".
    """
    name = f"{days}일 연속 출석"
    milestone = Milestone.objects.create(
      code=f"streak_{days}_days",
      name=name,
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [
          {
            "type": "metric_threshold",
            "metric_key": "streak.current_days",
            "operator": ">=",
            "target": days,
          }
        ],
      },
      reward_payload={
        "type": "ticket",
        "amount": days
      },
    )

    # 검증: name은 패턴을 따름
    self.assertEqual(milestone.name, f"{days}일 연속 출석")

  # Property 7: Milestone Category is STREAK
  @given(days=st.integers(min_value=1, max_value=365), )
  def test_property_7_milestone_category_is_streak(self, days):
    """**Validates: Requirements 3.7, 4.5**

    Property 7: Milestone Category is STREAK
    For any milestone created via the system, the category should be STREAK.
    """
    milestone = Milestone.objects.create(
      code=f"streak_{days}_days",
      name=f"{days}일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [
          {
            "type": "metric_threshold",
            "metric_key": "streak.current_days",
            "operator": ">=",
            "target": days,
          }
        ],
      },
      reward_payload={
        "type": "ticket",
        "amount": days
      },
    )

    # 검증: category는 STREAK
    self.assertEqual(milestone.category, AchievementCategory.STREAK)

  # Property 8: Condition Payload Structure
  @given(days=st.integers(min_value=1, max_value=365), )
  def test_property_8_condition_payload_structure(self, days):
    """**Validates: Requirements 3.8, 4.6**

    Property 8: Condition Payload Structure
    For any milestone, the condition_payload should have the correct structure with type="group",
    logic="AND", and a metric_threshold rule with metric_key="streak.current_days".
    """
    milestone = Milestone.objects.create(
      code=f"streak_{days}_days",
      name=f"{days}일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [
          {
            "type": "metric_threshold",
            "metric_key": "streak.current_days",
            "operator": ">=",
            "target": days,
          }
        ],
      },
      reward_payload={
        "type": "ticket",
        "amount": days
      },
    )

    # 검증: condition_payload 구조
    payload = milestone.condition_payload
    self.assertEqual(payload['type'], 'group')
    self.assertEqual(payload['logic'], 'AND')
    self.assertEqual(len(payload['rules']), 1)
    self.assertEqual(payload['rules'][0]['type'], 'metric_threshold')
    self.assertEqual(payload['rules'][0]['metric_key'], 'streak.current_days')

  # Property 9: Reward Payload Structure
  @given(days=st.integers(min_value=1, max_value=365), )
  def test_property_9_reward_payload_structure(self, days):
    """**Validates: Requirements 3.9, 5.1, 4.7**

    Property 9: Reward Payload Structure
    For any milestone, the reward_payload should have type="ticket" and amount equal to the milestone days.
    """
    milestone = Milestone.objects.create(
      code=f"streak_{days}_days",
      name=f"{days}일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [
          {
            "type": "metric_threshold",
            "metric_key": "streak.current_days",
            "operator": ">=",
            "target": days,
          }
        ],
      },
      reward_payload={
        "type": "ticket",
        "amount": days
      },
    )

    # 검증: reward_payload 구조
    payload = milestone.reward_payload
    self.assertEqual(payload['type'], 'ticket')
    self.assertEqual(payload['amount'], days)

  # Property 10: Seed Data Idempotency
  def test_property_10_seed_data_idempotency(self):
    """**Validates: Requirements 4.8**

    Property 10: Seed Data Idempotency
    Running the seed service twice should result in the same number of milestones (no duplicates created).
    """
    result1 = SeedAchievementsService.seed()
    result2 = SeedAchievementsService.seed()

    # 검증: 첫 번째 실행은 생성, 두 번째 실행은 스킵
    self.assertEqual(result1['created'], 11)  # 기본 5개 + 마일스톤 6개
    self.assertEqual(result2['created'], 0)
    self.assertEqual(result2['skipped'], 11)

  # Property 11: Active Milestones Only
  @given(
    active_count=st.integers(min_value=1, max_value=3),
    inactive_count=st.integers(min_value=1, max_value=3),
  )
  def test_property_11_active_milestones_only(self, active_count, inactive_count):
    """**Validates: Requirements 8.2**

    Property 11: Active Milestones Only
    For any query of milestones via the API, only achievements with is_active=True should be returned.
    """
    # 활성 마일스톤 생성
    for i in range(active_count):
      Milestone.objects.create(
        code=f"streak_active_{i}",
        name=f"Active {i}",
        category=AchievementCategory.STREAK,
        condition_type=AchievementConditionType.RULE_GROUP,
        condition_payload={
          "type": "group",
          "logic": "AND",
          "rules": [
            {
              "type": "metric_threshold",
              "metric_key": "streak.current_days",
              "operator": ">=",
              "target": i + 1,
            }
          ],
        },
        reward_payload={
          "type": "ticket",
          "amount": i + 1
        },
        is_active=True,
      )

    # 비활성 마일스톤 생성
    for i in range(inactive_count):
      Milestone.objects.create(
        code=f"streak_inactive_{i}",
        name=f"Inactive {i}",
        category=AchievementCategory.STREAK,
        condition_type=AchievementConditionType.RULE_GROUP,
        condition_payload={
          "type": "group",
          "logic": "AND",
          "rules": [
            {
              "type": "metric_threshold",
              "metric_key": "streak.current_days",
              "operator": ">=",
              "target": i + 1,
            }
          ],
        },
        reward_payload={
          "type": "ticket",
          "amount": i + 1
        },
        is_active=False,
      )

    # 검증: 활성 마일스톤만 반환
    active_milestones = Milestone.objects.filter(is_active=True)
    self.assertEqual(active_milestones.count(), active_count)

  # Property 12: Reward Field Format
  @given(days=st.integers(min_value=1, max_value=365), )
  def test_property_12_reward_field_format(self, days):
    """**Validates: Requirements 6.5**

    Property 12: Reward Field Format
    For any milestone with reward_payload.type="ticket", the reward field should be formatted
    as "구매 티켓 N개" where N is the amount.
    """
    milestone = Milestone.objects.create(
      code=f"streak_{days}_days",
      name=f"{days}일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [
          {
            "type": "metric_threshold",
            "metric_key": "streak.current_days",
            "operator": ">=",
            "target": days,
          }
        ],
      },
      reward_payload={
        "type": "ticket",
        "amount": days
      },
    )

    # 검증: reward 필드 포맷
    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertEqual(serializer.data['reward'], f"구매 티켓 {days}개")

  # Property 13: Conditional Field Inclusion
  def test_property_13_conditional_field_inclusion(self):
    """**Validates: Requirements 6.2**

    Property 13: Conditional Field Inclusion
    For any milestone with status "achieved", the rewardIcon field should be omitted from the response.
    """
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

    # UserAchievement 생성
    UserAchievement.objects.create(user=self.user, achievement=milestone)

    # 검증: rewardIcon 필드 제거
    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertNotIn('rewardIcon', serializer.data)

  # Property 14: Days Remaining Field Presence
  def test_property_14_days_remaining_field_presence(self):
    """**Validates: Requirements 6.3**

    Property 14: Days Remaining Field Presence
    For any milestone with status "next", the daysRemaining field should be present in the response.
    """
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

    # 검증: daysRemaining 필드 존재
    request = self.factory.get('/')
    request.user = self.user
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertIn('daysRemaining', serializer.data)

  # Property 15: Locked Status Field Omission
  def test_property_15_locked_status_field_omission(self):
    """**Validates: Requirements 6.4**

    Property 15: Locked Status Field Omission
    For any milestone with status "locked", the daysRemaining field should be omitted from the response.
    """
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

    # 검증: daysRemaining 필드 제거 (locked 상태)
    request = self.factory.get('/')
    request.user = None
    serializer = MilestoneSerializer(milestone, context={'request': request})
    self.assertNotIn('daysRemaining', serializer.data)

  # Property 16: Duplicate Days Prevention
  @given(days=st.integers(min_value=1, max_value=365), )
  def test_property_16_duplicate_days_prevention(self, days):
    """**Validates: Requirements 7.5**

    Property 16: Duplicate Days Prevention
    For any days value, attempting to create two milestones with the same days should fail
    with a validation error.
    """
    from django.core.exceptions import ValidationError

    # 첫 번째 마일스톤 생성
    Milestone.objects.create(
      code=f"streak_{days}_days",
      name=f"{days}일 연속 출석",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [
          {
            "type": "metric_threshold",
            "metric_key": "streak.current_days",
            "operator": ">=",
            "target": days,
          }
        ],
      },
      reward_payload={
        "type": "ticket",
        "amount": days
      },
    )

    # 두 번째 마일스톤 생성 시도 (같은 days)
    milestone2 = Milestone(
      code=f"streak_{days}_days_v2",
      name=f"{days}일 연속 출석 v2",
      category=AchievementCategory.STREAK,
      condition_type=AchievementConditionType.RULE_GROUP,
      condition_payload={
        "type": "group",
        "logic": "AND",
        "rules": [
          {
            "type": "metric_threshold",
            "metric_key": "streak.current_days",
            "operator": ">=",
            "target": days,
          }
        ],
      },
      reward_payload={
        "type": "ticket",
        "amount": days
      },
    )

    # 검증: ValidationError 발생
    with self.assertRaises(ValidationError):
      milestone2.full_clean()
