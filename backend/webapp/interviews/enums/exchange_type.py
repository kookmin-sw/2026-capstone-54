from django.db import models


class InterviewExchangeType(models.TextChoices):
  """면접 질문·답변 교환(Exchange) 종류.

    INITIAL: 초기 질문 — 이력서·채용공고 기반으로 면접관이 먼저 제시하는 질문.
    FOLLOWUP: 꼬리질문 — 지원자의 직전 답변을 바탕으로 심화하여 제시하는 질문.
    """

  INITIAL = "initial", "초기 질문"
  FOLLOWUP = "followup", "꼬리질문"
