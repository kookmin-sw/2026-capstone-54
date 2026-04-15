from django.apps import AppConfig


class JobDescriptionsConfig(AppConfig):
  default_auto_field = "django.db.models.BigAutoField"
  name = "job_descriptions"
  verbose_name = "채용공고"

  def ready(self):
    import job_descriptions.signals  # noqa: F401
