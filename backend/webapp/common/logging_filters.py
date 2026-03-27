"""
Logging filters for excluding specific paths.
"""

import logging


class ExcludeHealthCheckFilter(logging.Filter):
  """Health check 경로의 로그를 필터링한다."""

  def filter(self, record):
    # Health check 경로는 로그에서 제외
    message = record.getMessage()
    return '/api/v1/health-check' not in message
