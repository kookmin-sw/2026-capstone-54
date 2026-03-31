from django.apps import AppConfig


class CommonConfig(AppConfig):
  default_auto_field = "django.db.models.BigAutoField"
  name = "common"

  def ready(self):
    """Admin 대시보드 로그 조회를 경량화한다."""
    from django.contrib.admin.models import LogEntry
    from django.contrib.admin.sites import AdminSite

    if getattr(AdminSite, "_mefit_log_entries_patched", False):
      return

    def get_log_entries(self, request):
      return (
        LogEntry.objects.select_related("content_type").filter(user=request.user).only(
          "id",
          "action_time",
          "object_repr",
          "action_flag",
          "change_message",
          "user_id",
          "content_type__id",
          "content_type__app_label",
          "content_type__model",
        ).order_by("-action_time")
      )

    AdminSite.get_log_entries = get_log_entries
    AdminSite._mefit_log_entries_patched = True
