from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
  list_display = (
    "id",
    "user",
    "category",
    "is_read",
    "notifiable_type",
    "notifiable_id",
    "created_at",
  )
  list_filter = ("category", "is_read", "notifiable_type")
  search_fields = ("user__email", "message", "notifiable_id")
  readonly_fields = (
    "id",
    "created_at",
    "updated_at",
    "notifiable_type",
    "notifiable_id",
  )
  list_select_related = ("user", "notifiable_type")
  ordering = ("-created_at", )
