from django.db import models


class TermsType(models.TextChoices):
  TERMS_OF_SERVICE = "terms_of_service", "이용약관"
  PRIVACY_POLICY = "privacy_policy", "개인정보처리방침"
  AI_TRAINING_DATA = "ai_training_data", "AI 학습 데이터 활용 동의"
  MARKETING = "marketing", "마케팅 정보 수신 동의"
