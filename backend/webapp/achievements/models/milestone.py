"""마일스톤 프록시 모델."""

from achievements.enums import AchievementCategory
from achievements.models.achievement import Achievement
from django.core.exceptions import ValidationError
from django.db import models


class MilestoneManager(models.Manager):
  """STREAK 카테고리 업적만 반환하는 커스텀 매니저."""

  def get_queryset(self):
    return super().get_queryset().filter(category=AchievementCategory.STREAK)


class Milestone(Achievement):
  """마일스톤 프록시 모델 (STREAK 카테고리 업적)."""

  objects = MilestoneManager()

  class Meta:
    proxy = True
    verbose_name = "마일스톤"
    verbose_name_plural = "마일스톤 목록"
    ordering = ["condition_payload__rules__0__target"]

  def clean(self):
    """마일스톤 검증."""
    super().clean()

    # 보상 정보 검증
    self._validate_reward_payload()

    # 중복 days 값 방지
    self._validate_duplicate_days()

  def _validate_reward_payload(self):
    """보상 정보 검증."""
    payload = self.reward_payload
    if not payload:
      raise ValidationError({"reward_payload": "보상 정보가 필요합니다."})

    if payload.get('type') != 'ticket':
      raise ValidationError({"reward_payload": "보상 타입은 'ticket'이어야 합니다."})

    if not isinstance(payload.get('amount'), int) or payload.get('amount', 0) <= 0:
      raise ValidationError({"reward_payload": "보상 금액은 양의 정수여야 합니다."})

  def _validate_duplicate_days(self):
    """중복 days 값 방지."""
    # condition_payload에서 days 추출
    rules = self.condition_payload.get('rules', [])
    if not rules:
      return

    days = rules[0].get('target')
    if not days:
      return

    # 같은 days 값을 가진 다른 마일스톤 확인
    existing = Milestone.objects.filter(condition_payload__rules__0__target=days).exclude(pk=self.pk)

    if existing.exists():
      raise ValidationError({"condition_payload": f"{days}일 마일스톤이 이미 존재합니다."})

  def __str__(self):
    return f"마일스톤: {self.name} ({self.code})"
