"""
ContentTypes 기반 범용 토큰 사용량 추적 모델.

Django의 GenericForeignKey를 활용하여 어떤 모델 인스턴스에도 토큰 사용 내역을 연결할 수 있다.
(InterviewSession, InterviewExchange, Resume 등에 공통 적용)
"""

from decimal import Decimal

from common.models.base_model import BaseModel
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from llm_trackers.enums import TokenOperation, TokenUsageContext


class TokenUsage(BaseModel):
  """LLM API 호출당 토큰 사용 내역."""

  class Meta(BaseModel.Meta):
    db_table = "common_token_usages"
    verbose_name = "토큰 사용 내역"
    verbose_name_plural = "토큰 사용 내역 목록"

  # Polymorphic FK — UUID 또는 정수 PK 모두 수용하기 위해 CharField 사용
  token_usable_type = models.ForeignKey(
    ContentType,
    on_delete=models.CASCADE,
    verbose_name="관련 모델 타입",
  )
  token_usable_id = models.CharField(max_length=40, verbose_name="관련 객체 PK")
  token_usable = GenericForeignKey("token_usable_type", "token_usable_id")

  operation = models.CharField(
    max_length=20,
    choices=TokenOperation.choices,
    verbose_name="LLM 연산 종류",
  )
  context = models.CharField(
    max_length=30,
    choices=TokenUsageContext.choices,
    default=TokenUsageContext.OTHER,
    verbose_name="사용 컨텍스트",
  )
  model_name = models.CharField(max_length=100, verbose_name="LLM 모델명")
  input_tokens = models.PositiveIntegerField(default=0, verbose_name="입력 토큰")
  output_tokens = models.PositiveIntegerField(default=0, verbose_name="출력 토큰")
  total_tokens = models.PositiveIntegerField(default=0, verbose_name="전체 토큰")
  cost_usd = models.DecimalField(
    max_digits=10,
    decimal_places=6,
    default=Decimal("0"),
    verbose_name="비용 (USD)",
  )

  def __str__(self):
    return f"[{self.operation}/{self.context}] {self.model_name} — {self.total_tokens} tokens"

  @classmethod
  def log(
    cls,
    obj,
    operation: str,
    model_name: str,
    input_tokens: int,
    output_tokens: int,
    context: str = TokenUsageContext.OTHER,
    cost_usd: float = 0.0,
  ) -> "TokenUsage":
    """토큰 사용 내역을 기록하는 편의 클래스 메서드."""
    return cls.objects.create(
      token_usable_type=ContentType.objects.get_for_model(obj),
      token_usable_id=str(obj.pk),
      operation=operation,
      context=context,
      model_name=model_name,
      input_tokens=input_tokens,
      output_tokens=output_tokens,
      total_tokens=input_tokens + output_tokens,
      cost_usd=Decimal(str(cost_usd)),
    )
