from django.apps import AppConfig


class RealtimeDocsConfig(AppConfig):
  default_auto_field = "django.db.models.BigAutoField"
  name = "realtime_docs"
  verbose_name = "Realtime Docs"

  def ready(self) -> None:
    """앱 시작 시 등록된 consumer 모듈을 자동으로 import한다.

        REALTIME_DOCS_CONSUMERS 설정에 import 경로 목록을 지정하면
        해당 모듈의 @ws_consumer / @sse_consumer 데코레이터가 실행되어
        레지스트리에 등록된다.

        settings.py 예시::

            REALTIME_DOCS_CONSUMERS = [
                "api.v1.demo.consumers",
                "notifications.consumers",
            ]
        """
    import importlib

    from django.conf import settings

    for module_path in getattr(settings, "REALTIME_DOCS_CONSUMERS", []):
      importlib.import_module(module_path)
