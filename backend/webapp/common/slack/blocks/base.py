"""
Slack Block Kit 베이스 클래스.
"""

from __future__ import annotations

from abc import ABC, abstractmethod


class BaseBlock(ABC):
  """모든 Slack Block Kit 블록의 추상 베이스 클래스.

    서브클래스는 build() 를 구현하여 Slack API 에 전달할 dict 를 반환한다.
    __dict___ 프로토콜을 통해 dict() 변환도 지원한다.
    """

  @abstractmethod
  def build(self) -> dict:
    """Slack Block Kit 스펙에 맞는 dict 를 반환한다."""
    raise NotImplementedError
