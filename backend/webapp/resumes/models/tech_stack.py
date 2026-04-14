"""프로젝트 기술 스택 공용 참조 테이블."""

from common.models import BaseModelWithUUID
from django.db import models


class TechStack(BaseModelWithUUID):
  """ResumeProject 에서 참조하는 기술 스택 공용 참조 테이블."""

  class Meta(BaseModelWithUUID.Meta):
    db_table = "tech_stacks"
    verbose_name = "기술 스택"
    verbose_name_plural = "기술 스택"
    ordering = ["name"]

  name = models.CharField(max_length=100, unique=True, verbose_name="기술명")

  def __str__(self) -> str:
    return self.name

  @classmethod
  def get_or_create_normalized(cls, name: str) -> "TechStack | None":
    normalized = (name or "").strip()
    if not normalized:
      return None
    instance, _ = cls.objects.get_or_create(name=normalized)
    return instance
