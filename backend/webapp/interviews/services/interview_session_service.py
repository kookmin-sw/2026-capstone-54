"""면접 세션 생성·관리 서비스."""

from __future__ import annotations

import uuid

from common.exceptions import ConflictException, NotFoundException
from django.db import IntegrityError, transaction
from interviews.enums.session_status import InterviewSessionStatus
from interviews.models import InterviewSession

ACTIVE_SESSION_CONFLICT_DETAIL = "진행 중이거나 일시정지된 인터뷰 세션이 있습니다. 강제 종료 후 다시 시작하세요."


def create_interview_session(
  user,
  resume,
  user_job_description,
  interview_session_type: str,
  interview_difficulty_level: str,
  interview_practice_mode: str = "practice",
) -> InterviewSession:
  """면접 세션을 생성한다.

  resume와 user_job_description은 이미 검증된 DB 객체여야 한다.
  사용자가 제공한 UUID만으로 세션을 만들지 않는다; 뷰에서 소유권 검증 후 객체를 넘겨야 한다.
  """
  with transaction.atomic():
    active_session_exists = InterviewSession.objects.select_for_update().filter(
      user=user,
      interview_session_status__in=[
        InterviewSessionStatus.IN_PROGRESS,
        InterviewSessionStatus.PAUSED,
      ],
    ).exists()

    if active_session_exists:
      raise ConflictException(
        error_code="ACTIVE_INTERVIEW_SESSION_EXISTS",
        detail=ACTIVE_SESSION_CONFLICT_DETAIL,
      )

    try:
      return InterviewSession.objects.create(
        user=user,
        resume=resume,
        user_job_description=user_job_description,
        interview_session_type=interview_session_type,
        interview_difficulty_level=interview_difficulty_level,
        interview_practice_mode=interview_practice_mode,
      )
    except IntegrityError as exc:
      if "uq_active_interview_session_per_user" in str(exc):
        raise ConflictException(
          error_code="ACTIVE_INTERVIEW_SESSION_EXISTS",
          detail=ACTIVE_SESSION_CONFLICT_DETAIL,
        ) from exc
      raise


def get_interview_session_for_user(session_uuid: uuid.UUID, user) -> InterviewSession:
  """사용자 소유의 세션을 조회한다. 없으면 NotFoundException을 raise한다."""
  try:
    return InterviewSession.objects.select_related(
      "resume",
      "user_job_description__job_description",
    ).get(pk=session_uuid, user=user)
  except InterviewSession.DoesNotExist:
    raise NotFoundException()
