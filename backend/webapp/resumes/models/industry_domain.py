"""산업 도메인 공용 참조 테이블 (핀테크, 이커머스, 헬스케어 등)."""

from common.models import BaseModelWithUUID
from django.db import models


class IndustryDomain(BaseModelWithUUID):
  """이력서에서 감지된 산업 도메인 태그."""

  class Meta(BaseModelWithUUID.Meta):
    db_table = "industry_domains"
    verbose_name = "산업 도메인"
    verbose_name_plural = "산업 도메인"
    ordering = ["name"]

  name = models.CharField(max_length=100, unique=True, verbose_name="도메인명")

  def __str__(self) -> str:
    return self.name

  @classmethod
  def get_or_create_normalized(cls, name: str) -> "IndustryDomain | None":
    normalized = (name or "").strip()
    if not normalized:
      return None
    instance, _ = cls.objects.get_or_create(name=normalized)
    return instance
