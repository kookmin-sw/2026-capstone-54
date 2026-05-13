"""ResumeTextContentTemplate Unfold 어드민."""

from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from profiles.models import Job
from resumes.models import ResumeTextContentTemplate
from resumes.services.seed_resume_templates_service import SeedResumeTemplatesService
from unfold.admin import ModelAdmin
from unfold.decorators import action


@admin.register(ResumeTextContentTemplate)
class ResumeTextContentTemplateAdmin(ModelAdmin):
  list_display = [
    "job",
    "title",
    "display_order",
    "created_at",
    "updated_at",
  ]
  list_filter = [
    "job__category",
  ]
  list_select_related = (
    "job",
    "job__category",
  )
  search_fields = [
    "title",
    "content",
    "job__name",
  ]
  autocomplete_fields = [
    "job",
  ]
  readonly_fields = [
    "uuid",
    "created_at",
    "updated_at",
    "deleted_at",
  ]
  ordering = [
    "job__name",
    "display_order",
  ]
  actions_list = [
    "seed_default_templates",
  ]

  fieldsets = (
    ("기본 정보", {
      "fields": (
        "uuid",
        "job",
        "title",
        "display_order",
      )
    }),
    ("내용", {
      "fields": ("content", )
    }),
    ("메타", {
      "fields": (
        "created_at",
        "updated_at",
        "deleted_at",
      )
    }),
  )

  def get_queryset(self, request):
    return super().get_queryset(request).select_related("job", "job__category")

  def formfield_for_foreignkey(self, db_field, request, **kwargs):
    """autocomplete 로 렌더링되는 현재 선택 Job 의 __str__ 호출 시 발생하는 N+1 을 방지."""
    if db_field.name == "job":
      kwargs["queryset"] = Job.objects.select_related("category")
    return super().formfield_for_foreignkey(db_field, request, **kwargs)

  @action(description="기본 템플릿 시드 생성", url_path="seed-default-templates")
  def seed_default_templates(self, request: HttpRequest):
    """모든 Job에 대해 기본 이력서 템플릿이 없으면 생성한다."""
    created = SeedResumeTemplatesService.perform()
    self.message_user(request, f"기본 템플릿 {created}개가 생성되었습니다.")
    return redirect(reverse_lazy("admin:resumes_resumetextcontenttemplate_changelist"))

  def has_seed_default_templates_permission(self, request: HttpRequest):
    """기본 템플릿 시드 생성 권한"""
    return request.user.is_superuser
