from django.contrib import admin
from django.contrib.admin.utils import NestedObjects, quote
from django.db import router
from django.urls import NoReverseMatch, reverse
from django.utils.html import format_html
from django.utils.text import capfirst
from job_descriptions.models import JobDescription, UserJobDescription
from unfold.admin import ModelAdmin


class _NestedObjectsWithUserEager(NestedObjects):
  """삭제 확인 화면의 N+1 방지용 커스텀 collector.

    UserJobDescription 쿼리셋에 select_related("user")를 추가하여
    __str__() 호출 시 발생하는 N+1 쿼리를 제거한다.
    """

  def related_objects(self, related_model, related_fields, objs):
    qs = super().related_objects(related_model, related_fields, objs)
    if related_model is UserJobDescription:
      qs = qs.select_related("user")
    return qs


@admin.register(JobDescription)
class JobDescriptionAdmin(ModelAdmin):
  list_display = (
    "id",
    "company",
    "title",
    "platform",
    "collection_status",
    "scraped_at",
    "created_at",
  )
  list_filter = (
    "collection_status",
    "platform",
  )
  search_fields = (
    "title",
    "company",
    "url",
  )
  ordering = ("-created_at", )

  fieldsets = (
    (
      None,
      {
        "fields": (
          "url",
          "platform",
          "company",
          "title",
        ),
      },
    ),
    (
      "공고 본문",
      {
        "fields": (
          "duties",
          "requirements",
          "preferred",
        ),
      },
    ),
    (
      "근무 조건",
      {
        "fields": (
          "work_type",
          "salary",
          "location",
          "education",
          "experience",
        ),
      },
    ),
    (
      "수집 상태",
      {
        "fields": (
          "collection_status",
          "scraped_at",
          "error_message",
        ),
      },
    ),
    (
      "날짜",
      {
        "fields": (
          "created_at",
          "updated_at",
        ),
      },
    ),
  )
  readonly_fields = (
    "scraped_at",
    "created_at",
    "updated_at",
  )

  def get_deleted_objects(self, objs, request):
    """N+1 방지: UserJobDescription.user를 eager load하기 위해 커스텀 collector 사용.

        Django 기본 get_deleted_objects() 유틸은 NestedObjects를 직접 인스턴스화하므로
        서브클래스를 주입할 hook이 없다. 동일한 로직을 재구현하되 collector만 교체한다.
        """
    using = router.db_for_write(self.model)
    collector = _NestedObjectsWithUserEager(using=using, origin=objs)
    collector.collect(objs)

    perms_needed = set()
    admin_site = self.admin_site

    def format_callback(obj):
      model = obj.__class__
      opts = obj._meta
      no_edit_link = "%s: %s" % (capfirst(opts.verbose_name), obj)

      if admin_site.is_registered(model):
        if not admin_site.get_model_admin(model).has_delete_permission(request, obj):
          perms_needed.add(opts.verbose_name)
        try:
          admin_url = reverse(
            "%s:%s_%s_change" % (admin_site.name, opts.app_label, opts.model_name),
            None,
            (quote(obj.pk), ),
          )
        except NoReverseMatch:
          return no_edit_link
        return format_html(
          '{}: <a href="{}">{}</a>',
          capfirst(opts.verbose_name),
          admin_url,
          obj,
        )
      return no_edit_link

    to_delete = collector.nested(format_callback)
    protected = [format_callback(obj) for obj in collector.protected]
    model_count = {model._meta.verbose_name_plural: len(objs) for model, objs in collector.model_objs.items()}

    return to_delete, model_count, perms_needed, protected
