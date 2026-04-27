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
  interview_practice_mode: str = "practice",
  stt_mode: str | None = None,
) -> InterviewSession:
  """면접 세션을 생성한다.

  resume와 user_job_description은 이미 검증된 DB 객체여야 한다.
  사용자가 제공한 UUID만으로 세션을 만들지 않는다; 뷰에서 소유권 검증 후 객체를 넘겨야 한다.
  stt_mode 가 None 이면 모델 default(InterviewSttMode.BROWSER) 가 적용된다.

  사용자는 여러 active 세션을 동시에 가질 수 있다. 동일 세션 다중 접속은
  ClaimSessionOwnershipService + Channels eviction 으로 차단한다.
  """
  create_kwargs = dict(
    user=user,
    resume=resume,
    user_job_description=user_job_description,
    interview_session_type=interview_session_type,
    interview_difficulty_level=interview_difficulty_level,
    interview_practice_mode=interview_practice_mode,
  )
  if stt_mode is not None:
    create_kwargs["stt_mode"] = stt_mode

  return InterviewSession.objects.create(**create_kwargs)


def get_interview_session_for_user(session_uuid: uuid.UUID, user) -> InterviewSession:
  """사용자 소유의 세션을 조회한다. 없으면 NotFoundException을 raise한다."""
  try:
    return InterviewSession.objects.select_related(
      "resume",
      "user_job_description__job_description",
    ).get(pk=session_uuid, user=user)
  except InterviewSession.DoesNotExist:
    raise NotFoundException()
