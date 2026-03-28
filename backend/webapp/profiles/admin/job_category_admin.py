from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.utils import timezone
from profiles.models import JobCategory
from profiles.services import SeedService
from unfold.admin import ModelAdmin
from unfold.decorators import action


@admin.register(JobCategory)
class JobCategoryAdmin(ModelAdmin):
  list_display = ["emoji", "name", "is_opened", "opened_at", "created_at", "updated_at"]
  list_filter = ["opened_at", "created_at"]
  search_fields = ["name"]
  ordering = ["name"]
  readonly_fields = ["created_at", "updated_at", "deleted_at"]
  actions = ["bulk_open_categories", "bulk_close_categories"]
  actions_list = ["seed_default_data"]
  actions_row = ["open_category", "close_category"]

  fieldsets = (
    (None, {
      "fields": ("emoji", "name", "opened_at")
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
  @admin.action(description="선택한 직군 오픈")
  def bulk_open_categories(self, request, queryset):
    """선택한 직군들을 일괄 오픈"""
    updated = queryset.filter(opened_at__isnull=True).update(opened_at=timezone.now())
    self.message_user(request, f"{updated}개의 직군이 오픈되었습니다.")

  @admin.action(description="선택한 직군 닫기")
  def bulk_close_categories(self, request, queryset):
    """선택한 직군들을 일괄 닫기"""
    updated = queryset.filter(opened_at__isnull=False).update(opened_at=None)
    self.message_user(request, f"{updated}개의 직군이 닫혔습니다.")

  # Unfold changelist action
  @action(description="기본 데이터 생성", url_path="seed-data")
  def seed_default_data(self, request: HttpRequest):
    """기본 직군 및 직업 데이터 생성"""
    result = SeedService.seed_all()

    self.message_user(request, f"직군 {result['categories_created']}개, "
                      f"직업 {result['jobs_created']}개가 생성되었습니다.")

    return redirect(reverse_lazy("admin:profiles_jobcategory_changelist"))

  # Unfold row actions
  @action(description="직군 오픈", url_path="open-category")
  def open_category(self, request: HttpRequest, object_id: int):
    """선택한 직군을 오픈 처리"""
    category = JobCategory.objects.get(pk=object_id)

    if not category.opened_at:
      category.opened_at = timezone.now()
      category.save(update_fields=["opened_at", "updated_at"])
      self.message_user(request, f"'{category.name}' 직군이 오픈되었습니다.")
    else:
      self.message_user(request, f"'{category.name}' 직군은 이미 오픈되었습니다.")

    return redirect(reverse_lazy("admin:profiles_jobcategory_changelist"))

  @action(description="직군 닫기", url_path="close-category")
  def close_category(self, request: HttpRequest, object_id: int):
    """선택한 직군을 닫기 처리"""
    category = JobCategory.objects.get(pk=object_id)

    if category.opened_at:
      category.opened_at = None
      category.save(update_fields=["opened_at", "updated_at"])
      self.message_user(request, f"'{category.name}' 직군이 닫혔습니다.")
    else:
      self.message_user(request, f"'{category.name}' 직군은 이미 닫혀있습니다.")

    return redirect(reverse_lazy("admin:profiles_jobcategory_changelist"))

  # Permissions
  def has_seed_default_data_permission(self, request: HttpRequest):
    """기본 데이터 생성 권한"""
    return request.user.is_superuser

  def has_open_category_permission(self, request: HttpRequest):
    """직군 오픈 권한"""
    return request.user.is_staff

  def has_close_category_permission(self, request: HttpRequest):
    """직군 닫기 권한"""
    return request.user.is_staff
