from django.apps import AppConfig


class InterviewsConfig(AppConfig):
  default_auto_field = "django.db.models.BigAutoField"
  name = "interviews"
  verbose_name = "면접 관리"

  def ready(self):
    import interviews.signals  # noqa: F401
