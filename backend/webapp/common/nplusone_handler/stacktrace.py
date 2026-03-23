"""
앱 코드 stacktrace 추출.

표준 라이브러리, .venv, 인프라 코드를 제외하고
실제 N+1 을 유발한 뷰/서비스 프레임만 반환한다.
"""

from __future__ import annotations

import traceback

_APP_ROOT = "/app/webapp"
_APP_SKIP_PATHS = (
  "common/nplusone_handler/",
  "common/middlewares/",
)


def extract_app_stacktrace() -> str:
  """콜스택에서 /app/webapp 하위 비즈니스 코드 프레임만 반환한다."""
  frames = traceback.extract_stack()
  app_frames = [
    f for f in frames if (path := f.filename.replace("\\", "/")).startswith(_APP_ROOT)
    and not any(skip in path for skip in _APP_SKIP_PATHS)
  ]
  if not app_frames:
    return "(앱 코드 프레임 없음)"
  return "".join(traceback.format_list(app_frames))
