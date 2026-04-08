"""면접 세션 생성·관리 서비스."""

from __future__ import annotations

import uuid

from common.exceptions import NotFoundException
from interviews.models import InterviewSession


def create_interview_session(
  user,
  resume,
  user_job_description,
  interview_session_type: str,
  interview_difficulty_level: str,
) -> InterviewSession:
  """면접 세션을 생성한다.

    resume와 user_job_description은 이미 검증된 DB 객체여야 한다.
    사용자가 제공한 UUID만으로 세션을 만들지 않는다; 뷰에서 소유권 검증 후 객체를 넘겨야 한다.
    """

  return InterviewSession.objects.create(
    user=user,
    resume=resume,
    user_job_description=user_job_description,
    interview_session_type=interview_session_type,
    interview_difficulty_level=interview_difficulty_level,
  )


def get_interview_session_for_user(session_uuid: uuid.UUID, user) -> InterviewSession:
  """사용자 소유의 세션을 조회한다. 없으면 NotFoundException을 raise한다."""
  try:
    return InterviewSession.objects.select_related(
      "resume",
      "user_job_description__job_description",
    ).get(pk=session_uuid, user=user)
  except InterviewSession.DoesNotExist:
    raise NotFoundException()
