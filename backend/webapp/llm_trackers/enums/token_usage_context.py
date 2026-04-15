from django.db import models


class TokenUsageContext(models.TextChoices):
  """토큰이 어떤 기능/컨텍스트에서 사용되었는지 나타내는 분류."""

  INTERVIEW_QUESTION = "interview_question", "면접 초기 질문 생성"
  INTERVIEW_FOLLOWUP = "interview_followup", "꼬리질문 생성"
  INTERVIEW_ANALYSIS = "interview_analysis", "면접 분석 리포트 생성"
  RESUME_EMBED = "resume_embed", "이력서 임베딩"
  RESUME_ANALYZE = "resume_analyze", "이력서 LLM 분석"
  RESUME_SEARCH = "resume_search", "이력서 임베딩 검색"
  OTHER = "other", "기타"
