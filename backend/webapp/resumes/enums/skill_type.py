from django.db import models


class SkillType(models.TextChoices):
  """Skill 공용 참조 테이블의 분류 축.

  LLM 이 분류해준 그룹을 그대로 매핑한다. 프론트 배지 색상/섹션 분리에 사용.
  """

  TECHNICAL = "technical", "기술"
  SOFT = "soft", "소프트"
  TOOL = "tool", "도구"
  LANGUAGE = "language", "언어"
