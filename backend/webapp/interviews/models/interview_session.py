"""면접 세션 모델."""

from common.models import BaseModelWithUUID
from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from interviews.enums import (
  InterviewDifficultyLevel,
  InterviewPracticeMode,
  InterviewSessionStatus,
  InterviewSessionType,
)


class InterviewSession(BaseModelWithUUID):
  """사용자가 진행하는 하나의 면접 세션.

    WebSocket 연결 단위로 생성되며, 세션 종료 후 AnalysisReport가 비동기 생성된다.
    토큰 사용량은 TokenUsage 모델을 통해 관리한다.
    """

  class Meta(BaseModelWithUUID.Meta):
    db_table = "interview_sessions"
    verbose_name = "면접 세션"
    verbose_name_plural = "면접 세션 목록"

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="interview_sessions",
    verbose_name="사용자",
  )
  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="interview_sessions",
    verbose_name="이력서",
  )
  user_job_description = models.ForeignKey(
    "job_descriptions.UserJobDescription",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="interview_sessions",
    verbose_name="사용자 채용공고",
  )

  interview_session_type = models.CharField(
    max_length=20,
    choices=InterviewSessionType.choices,
    verbose_name="세션 유형",
  )
  interview_session_status = models.CharField(
    max_length=20,
    choices=InterviewSessionStatus.choices,
    default=InterviewSessionStatus.IN_PROGRESS,
    verbose_name="세션 상태",
  )
  interview_difficulty_level = models.CharField(
    max_length=20,
    choices=InterviewDifficultyLevel.choices,
    default=InterviewDifficultyLevel.NORMAL,
    verbose_name="난이도",
  )

  interview_practice_mode = models.CharField(
    max_length=20,
    choices=InterviewPracticeMode.choices,
    default=InterviewPracticeMode.PRACTICE,
    verbose_name="연습/실전 모드",
  )

  # 세션 통계
  total_questions = models.PositiveIntegerField(default=0, verbose_name="총 질문 수")
  total_followup_questions = models.PositiveIntegerField(default=0, verbose_name="총 꼬리질문 수")

  # TokenUsage 역방향 Generic Relation (토큰 사용 상세 내역)
  token_usages = GenericRelation(
    "llm_trackers.TokenUsage",
    content_type_field="token_usable_type",
    object_id_field="token_usable_id",
  )

  def __str__(self):
    return f"InterviewSession #{self.pk} [{self.get_interview_session_status_display()}]"

  def mark_completed(self) -> None:
    self.interview_session_status = InterviewSessionStatus.COMPLETED
    self.save(update_fields=["interview_session_status", "updated_at"])
