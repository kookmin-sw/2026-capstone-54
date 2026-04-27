"""면접 세션 모델."""

from common.models import BaseModelWithUUID
from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.utils import timezone
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
    constraints = [
      models.UniqueConstraint(
        fields=["user"],
        condition=models.Q(interview_session_status__in=["in_progress", "paused"]),
        name="uq_active_interview_session_per_user",
      ),
    ]

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

  # 세션 상태/소유권
  paused_at = models.DateTimeField(null=True, blank=True, verbose_name="일시정지 시각")
  pause_reason = models.CharField(max_length=20, blank=True, default="", verbose_name="일시정지 사유")
  pause_count = models.PositiveIntegerField(default=0, verbose_name="일시정지 횟수")
  total_paused_duration_ms = models.BigIntegerField(default=0, verbose_name="누적 일시정지 시간(ms)")
  last_heartbeat_at = models.DateTimeField(null=True, blank=True, verbose_name="최종 하트비트 수신 시각")
  owner_token_hash = models.CharField(max_length=128, blank=True, default="", verbose_name="소유 토큰 해시")
  owner_version = models.PositiveIntegerField(default=0, verbose_name="소유권 버전")

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

  def mark_paused(self, reason: str) -> None:
    """면접 세션을 일시정지 상태로 변경한다."""
    self.interview_session_status = InterviewSessionStatus.PAUSED
    self.paused_at = timezone.now()
    self.pause_count += 1
    self.pause_reason = reason
    self.save(update_fields=["interview_session_status", "paused_at", "pause_count", "pause_reason", "updated_at"])

  def mark_resumed(self) -> None:
    """면접 세션을 다시 진행 상태로 변경한다."""
    if self.paused_at is None:
      raise ValueError("일시정지 상태가 아닙니다")

    now = timezone.now()
    duration_ms = int((now - self.paused_at).total_seconds() * 1000)
    self.total_paused_duration_ms += duration_ms

    self.interview_session_status = InterviewSessionStatus.IN_PROGRESS
    self.paused_at = None
    self.pause_reason = ""
    self.save(
      update_fields=["interview_session_status", "paused_at", "pause_reason", "total_paused_duration_ms", "updated_at"]
    )

  def mark_owner_changed(self, token_hash: str) -> None:
    """면접 세션의 소유권을 변경한다."""
    self.owner_token_hash = token_hash
    self.owner_version += 1
    self.save(update_fields=["owner_token_hash", "owner_version", "updated_at"])
