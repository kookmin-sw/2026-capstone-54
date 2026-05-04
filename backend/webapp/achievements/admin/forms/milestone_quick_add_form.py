"""마일스톤 빠른 추가 폼."""

from achievements.enums import AchievementCategory, AchievementConditionType
from achievements.models import Milestone
from django import forms
from unfold.widgets import UnfoldAdminIntegerFieldWidget, UnfoldAdminTextareaWidget


class MilestoneQuickAddForm(forms.Form):
  """마일스톤 빠른 추가 폼."""

  days = forms.IntegerField(
    label="일 수",
    help_text="마일스톤 일 수 (예: 3, 7, 14, 30, 60, 100)",
    min_value=1,
    widget=UnfoldAdminIntegerFieldWidget,
  )
  reward_amount = forms.IntegerField(
    label="보상 티켓 수",
    help_text="달성 시 지급할 구매 티켓 수",
    min_value=1,
    widget=UnfoldAdminIntegerFieldWidget,
  )
  description = forms.CharField(
    label="설명",
    required=False,
    widget=UnfoldAdminTextareaWidget,
    help_text="마일스톤 설명 (선택사항, 비워두면 자동 생성)",
  )

  def save(self):
    """마일스톤 생성."""
    days = self.cleaned_data["days"]
    reward_amount = self.cleaned_data["reward_amount"]
    description = self.cleaned_data.get("description", "")

    code = f"streak_{days}_days"
    name = f"{days}일 연속 출석"
    description = description or f"{days}일 연속으로 면접에 참여하세요."

    milestone, created = Milestone.objects.get_or_create(
      code=code,
      defaults={
        "name": name,
        "description": description,
        "category": AchievementCategory.STREAK,
        "condition_type": AchievementConditionType.RULE_GROUP,
        "condition_payload": {
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
        "reward_payload": {
          "type": "ticket",
          "amount": reward_amount,
        },
        "is_active": True,
      },
    )

    return milestone, created
