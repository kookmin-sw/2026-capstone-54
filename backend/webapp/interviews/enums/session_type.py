from django.db import models


class InterviewSessionType(models.TextChoices):
  FOLLOWUP = "followup", "꼬리질문형 면접"
  FULL_PROCESS = "full_process", "전체 프로세스 면접"
