"""
Health check 경로의 request 로그를 제외하는 미들웨어.

django-structlog의 RequestMiddleware는 모든 요청을 로깅하므로,
health check 같은 빈번한 요청은 별도로 필터링이 필요하다.
"""


class ExcludeHealthCheckLoggingMiddleware:
  """Health check 경로의 structlog 로그를 제외한다."""

  def __init__(self, get_response):
    self.get_response = get_response

  def __call__(self, request):
    # Health check 경로는 로그 비활성화
    if request.path.startswith('/api/v1/health-check'):
      request._disable_structlog = True

    response = self.get_response(request)
    return response
