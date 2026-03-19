from .base_service import BaseService


class PingService(BaseService):
  """태스크 동작 검증용 서비스."""

  def execute(self):
    message = self.kwargs.get("message", "pong")
    return {"status": "ok", "message": message}
