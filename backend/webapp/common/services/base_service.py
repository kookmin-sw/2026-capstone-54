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
from collections import defaultdict

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction


class BaseService(ABC):
  """서비스 레이어의 공통 베이스 클래스. perform()으로 실행한다."""

  # 키 존재만 검증 (None 허용)
  required_kwargs: list[str] = []
  # 키 존재 + None이 아닌 값인지 검증
  required_value_kwargs: list[str] = []

  def __init__(self, user=None, **kwargs):
    self.user = user
    self.kwargs = kwargs

  def perform(self):
    """validate → execute 순서로 트랜잭션 내에서 실행한다."""
    self._validate_kwargs()
    self.validate()
    with transaction.atomic():
      return self.execute()

  def validate(self):
    """비즈니스 규칙 검증. 필요 시 오버라이드한다."""
    pass

  def _validate_kwargs(self):
    """kwargs를 검증한다."""
    field_errors = defaultdict(list)
    self._validate_required_kwargs(field_errors)
    self._validate_required_value_kwargs(field_errors)
    if field_errors:
      raise DjangoValidationError(dict(field_errors))

  def _validate_required_kwargs(self, field_errors: defaultdict):
    """kwargs에 키가 존재하는지 검증한다."""
    for key in self.required_kwargs:
      if key not in self.kwargs:
        field_errors[key].append(f"{key}은(는) 필수입니다.")

  def _validate_required_value_kwargs(self, field_errors: defaultdict):
    """kwargs에 키가 존재하고 값이 None이 아닌지 검증한다."""
    for key in self.required_value_kwargs:
      if key not in self.kwargs:
        field_errors[key].append(f"{key}은(는) 필수입니다.")
      elif self.kwargs[key] is None:
        field_errors[key].append(f"{key}은(는) None일 수 없습니다.")

  @abstractmethod
  def execute(self):
    """실제 비즈니스 로직. 반드시 구현해야 한다."""
    raise NotImplementedError
