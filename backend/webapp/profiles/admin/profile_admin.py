from django.contrib import admin
from django.utils.html import format_html
from profiles.models import Profile
from unfold.admin import ModelAdmin


@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
  list_display = ["user", "job_category", "avatar_preview", "created_at", "updated_at"]
  list_filter = ["job_category", "created_at"]
  search_fields = ["user__email", "user__name"]
  autocomplete_fields = ["user"]
  filter_horizontal = ["jobs"]
  ordering = ["-created_at"]
  readonly_fields = ["avatar_image", "created_at", "updated_at", "deleted_at"]

  fieldsets = (
    (None, {
      "fields": ("user", "job_category")
    }),
    ("아바타", {
      "fields": ("avatar_image", "avatar")
    }),
    ("희망 직업", {
      "fields": ("jobs", )
    }),
    ("날짜", {
      "fields": ("created_at", "updated_at", "deleted_at")
    }),
  )

  @admin.display(description="아바타")
  def avatar_preview(self, obj):
    if obj.avatar:
      return format_html(
        '<img src="{}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" />', obj.avatar.url
      )
    return "-"

  @admin.display(description="미리보기")
  def avatar_image(self, obj):
    if obj.avatar:
      return format_html('<img src="{}" style="max-width:200px;max-height:200px;border-radius:8px;" />', obj.avatar.url)
    return "아바타가 없습니다."
