from achievements.enums import AchievementCategory, AchievementConditionType
from achievements.validators.condition_payload_validator import validate_condition_payload
from common.models import BaseModel
from django.core.exceptions import ValidationError
from django.db import models


class Achievement(BaseModel):
  """도전과제 정의 모델."""

  # 하위 호환을 위한 별칭
  Category = AchievementCategory
  ConditionType = AchievementConditionType

  class Meta(BaseModel.Meta):
    verbose_name = "도전과제"
    verbose_name_plural = "도전과제 목록"
    ordering = ["category", "code"]
    indexes = BaseModel.Meta.indexes + [
      models.Index(fields=["is_active", "starts_at", "ends_at", "category"], name="achv_active_period_idx"),
    ]

  code = models.CharField(max_length=100, unique=True, verbose_name="도전과제 코드")
  name = models.CharField(max_length=100, verbose_name="도전과제 이름")
  description = models.TextField(blank=True, default="", verbose_name="도전과제 설명")
  category = models.CharField(max_length=30, choices=Category.choices, default=Category.OTHER, verbose_name="도전과제 카테고리")
  condition_type = models.CharField(
    max_length=30,
    choices=ConditionType.choices,
    default=ConditionType.RULE_GROUP,
    verbose_name="조건 타입",
  )
  condition_schema_version = models.PositiveSmallIntegerField(default=1, verbose_name="조건 스키마 버전")
  condition_payload = models.JSONField(default=dict, verbose_name="도전과제 조건 DSL")
  reward_payload = models.JSONField(default=dict, verbose_name="보상 정보")
  is_active = models.BooleanField(default=True, verbose_name="활성 여부")
  starts_at = models.DateTimeField(null=True, blank=True, verbose_name="달성 가능 시작 시각")
  ends_at = models.DateTimeField(null=True, blank=True, verbose_name="달성 가능 종료 시각")

  def clean(self):
    super().clean()
    if self.starts_at and self.ends_at and self.starts_at > self.ends_at:
      raise ValidationError({"ends_at": "종료 시각은 시작 시각보다 같거나 이후여야 합니다."})
    if self.condition_schema_version != 1:
      raise ValidationError({"condition_schema_version": "현재는 condition_schema_version=1만 지원합니다."})

    try:
      validate_condition_payload(self.condition_payload, schema_version=self.condition_schema_version)
    except ValidationError as exc:
      messages = getattr(exc, "messages", None) or ["condition_payload 검증에 실패했습니다."]
      raise ValidationError({"condition_payload": [f"도전과제 조건 검증 실패: {message}" for message in messages]}) from exc

  def __str__(self):
    return f"{self.name} ({self.code})"
