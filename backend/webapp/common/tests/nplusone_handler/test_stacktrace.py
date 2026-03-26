"""
nplusone_handler.stacktrace 모듈 테스트.

traceback.extract_stack() 을 mock 하여 필터링 로직을 검증한다.
"""

from unittest.mock import patch

from common.nplusone_handler.stacktrace import extract_app_stacktrace
from django.test import TestCase


class ExtractAppStacktraceTest(TestCase):
  """extract_app_stacktrace 필터링 테스트"""

  def _make_frame(self, filename: str, lineno: int = 1, name: str = "func", line: str = "pass"):
    """FrameSummary 대신 traceback.FrameSummary 호환 namedtuple을 반환한다."""
    import traceback
    return traceback.FrameSummary(filename, lineno, name, lookup_line=False)

  @patch("common.nplusone_handler.stacktrace.traceback.extract_stack")
  def test_filters_out_non_app_frames(self, mock_extract):
    """앱 루트(/app/webapp) 외부 프레임은 제외된다."""
    mock_extract.return_value = [
      self._make_frame("/usr/lib/python3.11/logging/__init__.py"),
      self._make_frame("/app/webapp/api/v1/users/views/sign_up_api_view.py"),
    ]
    result = extract_app_stacktrace()
    self.assertIn("sign_up_api_view", result)
    self.assertNotIn("logging", result)

  @patch("common.nplusone_handler.stacktrace.traceback.extract_stack")
  def test_filters_out_nplusone_handler_frames(self, mock_extract):
    """common/nplusone_handler/ 경로 프레임은 제외된다."""
    mock_extract.return_value = [
      self._make_frame("/app/webapp/common/nplusone_handler/handler.py"),
      self._make_frame("/app/webapp/api/v1/users/views/sign_up_api_view.py"),
    ]
    result = extract_app_stacktrace()
    self.assertNotIn("nplusone_handler", result)
    self.assertIn("sign_up_api_view", result)

  @patch("common.nplusone_handler.stacktrace.traceback.extract_stack")
  def test_filters_out_middleware_frames(self, mock_extract):
    """common/middlewares/ 경로 프레임은 제외된다."""
    mock_extract.return_value = [
      self._make_frame("/app/webapp/common/middlewares/camel_case_middleware.py"),
      self._make_frame("/app/webapp/api/v1/users/views/sign_up_api_view.py"),
    ]
    result = extract_app_stacktrace()
    self.assertNotIn("middlewares", result)
    self.assertIn("sign_up_api_view", result)

  @patch("common.nplusone_handler.stacktrace.traceback.extract_stack")
  def test_returns_fallback_when_no_app_frames(self, mock_extract):
    """앱 코드 프레임이 없으면 fallback 문자열을 반환한다."""
    mock_extract.return_value = [
      self._make_frame("/usr/lib/python3.11/threading.py"),
    ]
    result = extract_app_stacktrace()
    self.assertIn("앱 코드 프레임 없음", result)

  @patch("common.nplusone_handler.stacktrace.traceback.extract_stack")
  def test_returns_fallback_when_empty_stack(self, mock_extract):
    """스택이 비어 있으면 fallback 문자열을 반환한다."""
    mock_extract.return_value = []
    result = extract_app_stacktrace()
    self.assertIn("앱 코드 프레임 없음", result)
