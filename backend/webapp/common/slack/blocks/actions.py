"""
Slack Block Kit — Actions 블록.
https://docs.slack.dev/reference/block-kit/blocks/actions-block

버튼, 날짜 선택기 등 인터랙티브 요소를 담는 블록.
주로 알림 메시지에 "확인", "무시" 같은 버튼을 붙일 때 사용한다.
"""

from __future__ import annotations

from .base import BaseBlock


class ButtonElement:
  """Actions 블록 안에 넣을 버튼 요소.

    Args:
        text:      버튼 레이블
        action_id: 인터랙션 페이로드에서 버튼을 식별하는 ID
        value:     버튼 클릭 시 전달할 값 (선택)
        style:     "primary"(파란색) | "danger"(빨간색) | None(기본 회색)
        url:       클릭 시 열릴 URL (선택, value 와 함께 사용 불가)
    """

  def __init__(
    self,
    text: str,
    action_id: str,
    value: str = "",
    style: str | None = None,
    url: str = "",
  ) -> None:
    self.text = text
    self.action_id = action_id
    self.value = value
    self.style = style
    self.url = url

  def build(self) -> dict:
    element: dict = {
      "type": "button",
      "text": {
        "type": "plain_text",
        "text": self.text,
        "emoji": True
      },
      "action_id": self.action_id,
    }
    if self.value:
      element["value"] = self.value
    if self.style in ("primary", "danger"):
      element["style"] = self.style
    if self.url:
      element["url"] = self.url
    return element


class ActionsBlock(BaseBlock):
  """버튼 등 인터랙티브 요소를 가로로 나열하는 actions 블록.

    Args:
        elements: ButtonElement 등 .build() 를 가진 요소 목록 (최대 25개)

    Example::

        ActionsBlock([
            ButtonElement("확인", action_id="ack", style="primary"),
            ButtonElement("무시", action_id="dismiss", style="danger"),
        ])
    """

  def __init__(self, elements: list) -> None:
    self.elements = elements

  def build(self) -> dict:
    return {
      "type": "actions",
      "elements": [e.build() for e in self.elements],
    }
