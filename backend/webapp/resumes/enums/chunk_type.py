from django.db import models


class ChunkType(models.TextChoices):
  """이력서 임베딩 청크의 유형.

  원문 텍스트 청크(TEXT) 외에, 정규화된 섹션별 임베딩 유형을 구분해 저장한다.
  검색 시 특정 섹션(예: 경력만) 필터링을 가능하게 한다.
  """

  TEXT = "text", "텍스트 청크"
  SUMMARY = "summary", "요약"
  BASIC_INFO = "basic_info", "기본 정보"
  SKILL = "skill", "스킬"
  EXPERIENCE = "experience", "경력"
  EDUCATION = "education", "학력"
  CERTIFICATION = "certification", "자격증"
  AWARD = "award", "수상 이력"
  PROJECT = "project", "프로젝트"
  LANGUAGE_SPOKEN = "language_spoken", "구사 언어"
  INDUSTRY_DOMAIN = "industry_domain", "산업 도메인"
  KEYWORD = "keyword", "키워드"
