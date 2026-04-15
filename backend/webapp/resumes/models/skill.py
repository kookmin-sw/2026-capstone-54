"""이력서에서 감지된 스킬 공용 참조 테이블.

이력서 간 공유되어 'Python 스킬을 가진 이력서 검색' 같은 쿼리가 가능하도록 정규화한다.
`name` + `skill_type` 조합으로 유일하며, 이름은 lowercase + trim 된 값으로 저장한다.
"""

from common.models import BaseModelWithUUID
from django.db import models
from resumes.enums import SkillType


class Skill(BaseModelWithUUID):
  """스킬 공용 참조 엔트리 (technical / soft / tool / language)."""

  class Meta(BaseModelWithUUID.Meta):
    db_table = "skills"
    verbose_name = "이력서 스킬"
    verbose_name_plural = "이력서 스킬"
    ordering = ["skill_type", "name"]
    constraints = [
      models.UniqueConstraint(
        fields=["name", "skill_type"],
        name="uniq_resumes_skill_name_type",
      ),
    ]
    indexes = [
      models.Index(fields=["skill_type", "name"]),
    ]

  name = models.CharField(max_length=100, verbose_name="스킬명")
  skill_type = models.CharField(
    max_length=20,
    choices=SkillType.choices,
    verbose_name="스킬 분류",
  )

  def __str__(self) -> str:
    return f"[{self.skill_type}] {self.name}"

  @classmethod
  def normalize_name(cls, raw: str) -> str:
    """스킬명을 lowercase + strip 으로 정규화한다."""
    return (raw or "").strip().lower()

  @classmethod
  def get_or_create_normalized(cls, name: str, skill_type: str) -> "Skill | None":
    """정규화된 이름 + 분류로 스킬 row 를 가져오거나 생성한다."""
    normalized = cls.normalize_name(name)
    if not normalized:
      return None
    instance, _ = cls.objects.get_or_create(
      name=normalized,
      skill_type=skill_type,
    )
    return instance
