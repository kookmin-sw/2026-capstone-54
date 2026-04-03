from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.utils import timezone
from profiles.models import Job
from unfold.admin import ModelAdmin
from unfold.decorators import action


@admin.register(Job)
class JobAdmin(ModelAdmin):
  list_display = ["name", "category", "is_opened", "opened_at", "created_at", "updated_at"]
  list_filter = ["category", "opened_at", "created_at"]
  search_fields = ["name", "category__name"]
  autocomplete_fields = ["category"]
  ordering = ["category", "name"]
  readonly_fields = ["created_at", "updated_at", "deleted_at"]
  actions = ["bulk_open_jobs", "bulk_close_jobs"]
  actions_row = ["open_job", "close_job"]

  fieldsets = (
    (None, {
      "fields": ("name", "category", "opened_at")
    }),
    ("날짜", {
      "fields": ("created_at", "updated_at", "deleted_at")
    }),
  )

  @admin.display(boolean=True, description="오픈 여부")
  def is_opened(self, obj):
    """오픈 여부 표시"""
    return obj.is_opened

  # Django 기본 actions (checkbox 선택)
  @admin.action(description="선택한 직업 오픈")
  def bulk_open_jobs(self, request, queryset):
    """선택한 직업들을 일괄 오픈"""
    updated = queryset.filter(opened_at__isnull=True).update(opened_at=timezone.now())
    self.message_user(request, f"{updated}개의 직업이 오픈되었습니다.")

  @admin.action(description="선택한 직업 닫기")
  def bulk_close_jobs(self, request, queryset):
    """선택한 직업들을 일괄 닫기"""
    updated = queryset.filter(opened_at__isnull=False).update(opened_at=None)
    self.message_user(request, f"{updated}개의 직업이 닫혔습니다.")

  # Unfold row actions
  @action(description="직업 오픈", url_path="open-job")
  def open_job(self, request: HttpRequest, object_id: int):
    """선택한 직업을 오픈 처리"""
    job = get_object_or_404(Job, pk=object_id)

    if not job.opened_at:
      job.opened_at = timezone.now()
      job.save(update_fields=["opened_at", "updated_at"])
      self.message_user(request, f"'{job.name}' 직업이 오픈되었습니다.")
    else:
      self.message_user(request, f"'{job.name}' 직업은 이미 오픈되었습니다.")

    return redirect(reverse_lazy("admin:profiles_job_changelist"))

  @action(description="직업 닫기", url_path="close-job")
  def close_job(self, request: HttpRequest, object_id: int):
    """선택한 직업을 닫기 처리"""
    job = get_object_or_404(Job, pk=object_id)

    if job.opened_at:
      job.opened_at = None
      job.save(update_fields=["opened_at", "updated_at"])
      self.message_user(request, f"'{job.name}' 직업이 닫혔습니다.")
    else:
      self.message_user(request, f"'{job.name}' 직업은 이미 닫혀있습니다.")

    return redirect(reverse_lazy("admin:profiles_job_changelist"))

  # Permissions
  def has_open_job_permission(self, request: HttpRequest):
    """직업 오픈 권한"""
    return request.user.is_staff

  def has_close_job_permission(self, request: HttpRequest):
    """직업 닫기 권한"""
    return request.user.is_staff
