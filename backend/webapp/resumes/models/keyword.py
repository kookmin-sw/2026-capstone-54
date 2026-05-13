"""이력서 키워드 공용 참조 테이블."""

from common.models import BaseModelWithUUID
from django.db import models


class Keyword(BaseModelWithUUID):
  """이력서에서 감지된 자유 키워드 태그."""

  class Meta(BaseModelWithUUID.Meta):
    db_table = "keywords"
    verbose_name = "이력서 키워드"
    verbose_name_plural = "이력서 키워드"
    ordering = ["text"]

  text = models.CharField(max_length=100, unique=True, verbose_name="키워드")

  def __str__(self) -> str:
    return self.text

  @classmethod
  def get_or_create_normalized(cls, text: str) -> "Keyword | None":
    normalized = (text or "").strip()
    if not normalized:
      return None
    instance, _ = cls.objects.get_or_create(text=normalized)
    return instance
