from common.models import BaseModelWithUUID
from django.conf import settings
from django.db import models
from interviews.enums import BehaviorAnalysisStatus


class InterviewBehaviorAnalysis(BaseModelWithUUID):

  class Meta(BaseModelWithUUID.Meta):
    db_table = "interview_behavior_analyses"
    verbose_name = "면접 행동 분석"
    verbose_name_plural = "면접 행동 분석 목록"

  interview_session = models.ForeignKey(
    "interviews.InterviewSession",
    on_delete=models.CASCADE,
    related_name="behavior_analyses",
    verbose_name="면접 세션",
  )
  interview_turn = models.ForeignKey(
    "interviews.InterviewTurn",
    on_delete=models.CASCADE,
    related_name="behavior_analyses",
    verbose_name="면접 턴",
  )
  interview_recording = models.ForeignKey(
    "interviews.InterviewRecording",
    on_delete=models.CASCADE,
    related_name="behavior_analyses",
    verbose_name="면접 녹화",
    null=True,
    blank=True,
  )
  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="behavior_analyses",
    verbose_name="사용자",
  )

  status = models.CharField(
    max_length=20,
    choices=BehaviorAnalysisStatus.choices,
    default=BehaviorAnalysisStatus.PENDING,
    verbose_name="상태",
  )

  expression_data = models.JSONField(
    default=dict,
    blank=True,
    verbose_name="표정 분석 데이터",
  )
  speech_data = models.JSONField(
    default=dict,
    blank=True,
    verbose_name="음성 분석 데이터",
  )

  def __str__(self):
    return f"BehaviorAnalysis {self.pk} ({self.status})"
