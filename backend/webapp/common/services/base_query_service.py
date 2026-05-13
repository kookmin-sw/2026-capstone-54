"""
읽기 전용 서비스 레이어 베이스 모듈.

트랜잭션 없이 조회 로직만 수행한다.

Usage::

  class InterviewReportQueryService(BaseQueryService):
    def execute(self):
      return InterviewReport.objects.filter(
        user=self.user,
        interview_id=self.kwargs["interview_id"],
      ).select_related("interview").first()

  # view에서 호출
  report = InterviewReportQueryService(
    user=request.user,
    interview_id=1,
  ).perform()
"""

from .base_service import BaseService


class BaseQueryService(BaseService):
  """읽기 전용 서비스의 공통 베이스 클래스. 트랜잭션 없이 perform()으로 실행한다."""

  def perform(self):
    """validate → execute 순서로 실행한다. 트랜잭션 없음."""
    self._validate_kwargs()
    self.validate()
    return self.execute()
