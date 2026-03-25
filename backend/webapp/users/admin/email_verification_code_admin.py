from django.contrib import admin
from unfold.admin import ModelAdmin
from users.models import EmailVerificationCode


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(ModelAdmin):
  list_display = ("user", "code", "is_used", "expires_at", "used_at", "created_at")
  list_filter = ("used_at", )
  search_fields = ("user__email", "code")
  ordering = ("-created_at", )
  readonly_fields = ("is_used", "used_at", "expires_at", "created_at", "updated_at")

  fieldsets = (
    (None, {
      "fields": ("user", "code")
    }),
    ("상태", {
      "fields": ("is_used", "used_at", "expires_at")
    }),
    ("날짜", {
      "fields": ("created_at", "updated_at")
    }),
  )
