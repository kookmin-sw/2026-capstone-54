from django.db import models


class AnalysisStep(models.TextChoices):
  QUEUED = "queued", "큐 대기"
  EXTRACTING_TEXT = "extracting_text", "텍스트 추출 중"
  EMBEDDING = "embedding", "임베딩 생성 중"
  ANALYZING = "analyzing", "LLM 분석 중"
  FINALIZING = "finalizing", "최종 처리 중"
  DONE = "done", "완료"
