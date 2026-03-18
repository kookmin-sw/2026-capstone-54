"""
서비스 레이어 베이스 모듈.

Usage::

  class CreateResumeService(BaseService):
    def validate(self):
      if self.user.resumes.count() >= 5:
        raise ValidationError("이력서는 최대 5개까지 등록 가능합니다.")

    def execute(self):
      return Resume.objects.create(
        user=self.user,
        title=self.kwargs["title"],
        content=self.kwargs["content"],
      )

  # view에서 호출
  result = CreateResumeService(
    user=request.user,
    title="백엔드 개발자",
    content="...",
  ).perform()
"""

from abc import ABC, abstractmethod

from django.db import transaction


class BaseService(ABC):
  """서비스 레이어의 공통 베이스 클래스. perform()으로 실행한다."""

  def __init__(self, user=None, **kwargs):
    self.user = user
    self.kwargs = kwargs

  def perform(self):
    """validate → execute 순서로 트랜잭션 내에서 실행한다."""
    self.validate()
    with transaction.atomic():
      return self.execute()

  def validate(self):
    """비즈니스 규칙 검증. 필요 시 오버라이드한다."""
    pass

  @abstractmethod
  def execute(self):
    """실제 비즈니스 로직. 반드시 구현해야 한다."""
    raise NotImplementedError
