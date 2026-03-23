from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from users.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
  list_display = ("email", "name", "is_email_confirmed", "is_profile_completed", "is_staff", "is_active", "created_at")
  list_filter = ("is_staff", "is_active")
  search_fields = ("email", "name")
  ordering = ("-created_at", )

  fieldsets = (
    (None, {
      "fields": ("email", "password", "name")
    }),
    ("인증 상태", {
      "fields": ("email_confirmed_at", "profile_completed_at")
    }),
    ("권한", {
      "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")
    }),
    ("날짜", {
      "fields": ("last_login", "created_at", "updated_at", "deleted_at")
    }),
  )
  add_fieldsets = ((None, {
    "classes": ("wide", ),
    "fields": ("email", "name", "password1", "password2"),
  }), )
  readonly_fields = ("created_at", "updated_at", "deleted_at", "last_login")
