"""pytest 설정 파일.

pytest-django가 Django 앱을 올바르게 초기화하도록 설정한다.
"""

import django


def pytest_configure(config):
  """pytest 실행 전 Django 설정을 초기화한다."""
  import os

  os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.test")

  # .env 파일에서 환경 변수 로드
  env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
  if os.path.exists(env_path):
    with open(env_path) as f:
      for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
          key, _, value = line.partition("=")
          key = key.strip()
          value = value.strip()
          if key and key not in os.environ:
            os.environ[key] = value

  django.setup()
