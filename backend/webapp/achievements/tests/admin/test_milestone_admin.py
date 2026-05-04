"""마일스톤 Admin 테스트."""

from achievements.admin.milestone_admin import MilestoneQuickAddForm
from achievements.enums import AchievementCategory, AchievementConditionType
from achievements.models import Milestone
from django.test import TestCase


class MilestoneQuickAddFormTests(TestCase):
  """마일스톤 빠른 추가 폼 테스트."""

  def test_form_generates_correct_code_pattern(self):
    """코드 생성 패턴 검증."""
    form = MilestoneQuickAddForm(data={'days': 7, 'reward_amount': 7})
    self.assertTrue(form.is_valid())

    milestone, created = form.save()
    self.assertTrue(created)
    self.assertEqual(milestone.code, "streak_7_days")

  def test_form_generates_correct_name_pattern(self):
    """이름 생성 패턴 검증."""
    form = MilestoneQuickAddForm(data={'days': 14, 'reward_amount': 14})
    self.assertTrue(form.is_valid())

    milestone, created = form.save()
    self.assertTrue(created)
    self.assertEqual(milestone.name, "14일 연속 출석")

  def test_form_sets_category_to_streak(self):
    """카테고리 설정 검증."""
    form = MilestoneQuickAddForm(data={'days': 30, 'reward_amount': 30})
    self.assertTrue(form.is_valid())

    milestone, created = form.save()
    self.assertTrue(created)
    self.assertEqual(milestone.category, AchievementCategory.STREAK)

  def test_form_creates_correct_condition_payload(self):
    """condition_payload 구조 검증."""
    form = MilestoneQuickAddForm(data={'days': 60, 'reward_amount': 60})
    self.assertTrue(form.is_valid())

    milestone, created = form.save()
    self.assertTrue(created)

    payload = milestone.condition_payload
    self.assertEqual(payload['type'], 'group')
    self.assertEqual(payload['logic'], 'AND')
    self.assertEqual(len(payload['rules']), 1)
    self.assertEqual(payload['rules'][0]['type'], 'metric_threshold')
    self.assertEqual(payload['rules'][0]['metric_key'], 'streak.current_days')
    self.assertEqual(payload['rules'][0]['operator'], '>=')
    self.assertEqual(payload['rules'][0]['target'], 60)

  def test_form_creates_correct_reward_payload(self):
    """reward_payload 구조 검증."""
    form = MilestoneQuickAddForm(data={'days': 100, 'reward_amount': 100})
    self.assertTrue(form.is_valid())

    milestone, created = form.save()
    self.assertTrue(created)

    payload = milestone.reward_payload
    self.assertEqual(payload['type'], 'ticket')
    self.assertEqual(payload['amount'], 100)

  def test_form_is_idempotent(self):
    """폼이 멱등성을 가지는지 검증."""
    form1 = MilestoneQuickAddForm(data={'days': 7, 'reward_amount': 7})
    self.assertTrue(form1.is_valid())
    milestone1, created1 = form1.save()
    self.assertTrue(created1)

    form2 = MilestoneQuickAddForm(data={'days': 7, 'reward_amount': 7})
    self.assertTrue(form2.is_valid())
    milestone2, created2 = form2.save()
    self.assertFalse(created2)

    self.assertEqual(milestone1.id, milestone2.id)

  def test_form_validates_days_field(self):
    """days 필드 검증."""
    form = MilestoneQuickAddForm(data={'days': 0, 'reward_amount': 7})
    self.assertFalse(form.is_valid())

    form = MilestoneQuickAddForm(data={'days': -1, 'reward_amount': 7})
    self.assertFalse(form.is_valid())

  def test_form_validates_reward_amount_field(self):
    """reward_amount 필드 검증."""
    form = MilestoneQuickAddForm(data={'days': 7, 'reward_amount': 0})
    self.assertFalse(form.is_valid())

    form = MilestoneQuickAddForm(data={'days': 7, 'reward_amount': -1})
    self.assertFalse(form.is_valid())


class MilestoneAdminTests(TestCase):
  """마일스톤 Admin 테스트."""

  def test_milestone_admin_displays_days(self):
    """Admin에서 days 필드 표시 검증."""
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

    from achievements.admin import MilestoneAdmin
    admin = MilestoneAdmin(Milestone, None)
    self.assertEqual(admin.days_display(milestone), 7)

  def test_milestone_admin_displays_reward(self):
    """Admin에서 reward 필드 표시 검증."""
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

    from achievements.admin import MilestoneAdmin
    admin = MilestoneAdmin(Milestone, None)
    self.assertEqual(admin.reward_display(milestone), "티켓 7개")
