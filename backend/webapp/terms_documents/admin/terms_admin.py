from django import forms
from django.contrib import admin
from django.db import transaction
from django.http import HttpRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from easymde.widgets import EasyMDEEditor
from terms_documents.enums import TermsType
from terms_documents.models import TermsDocument
from unfold.admin import ModelAdmin
from unfold.decorators import action


class TermsDocumentAdminForm(forms.ModelForm):
  content = forms.CharField(
    widget=EasyMDEEditor(),
    label="내용 (마크다운)",
  )

  class Meta:
    model = TermsDocument
    fields = "__all__"


@admin.register(TermsDocument)
class TermsDocumentAdmin(ModelAdmin):
  form = TermsDocumentAdminForm
  list_display = (
    "title",
    "terms_type",
    "version",
    "is_published",
    "published_at",
    "is_required",
    "effective_at",
    "created_at",
  )
  list_filter = (
    "terms_type",
    "published_at",
    "is_required",
  )
  search_fields = ("title", )
  ordering = ("-created_at", )
  readonly_fields = (
    "version",
    "created_at",
    "updated_at",
  )

  fieldsets = (
    (None, {
      "fields": (
        "terms_type",
        "version",
        "title",
        "published_at",
        "is_required",
        "effective_at",
      ),
    }),
    ("내용", {
      "fields": ("content", ),
    }),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
      ),
    }),
  )

  actions = ["make_published", "make_unpublished", "create_new_version"]
  actions_list = ["create_default_terms"]

  def save_model(self, request, obj, form, change):
    with transaction.atomic():
      if obj.published_at:
        TermsDocument.objects.filter(terms_type=obj.terms_type,
                                     published_at__isnull=False).exclude(pk=obj.pk).update(published_at=None)
      super().save_model(request, obj, form, change)

  @admin.action(description="선택된 약관 공개하기")
  def make_published(self, request, queryset):
    queryset.update(published_at="now")

  @admin.action(description="선택된 약관 비공개로 전환")
  def make_unpublished(self, request, queryset):
    queryset.update(published_at=None)

  @admin.action(description="새 버전으로 복사")
  def create_new_version(self, request, queryset):
    if not queryset.exists():
      self.message_user(request, "약관을 선택해주세요.", level="error")
      return

    for terms in queryset:
      TermsDocument.objects.create(
        terms_type=terms.terms_type,
        title=terms.title,
        content=terms.content,
        is_required=terms.is_required,
        effective_at=terms.effective_at,
      )
    self.message_user(request, f"{queryset.count()}개의 약관이 새 버전으로 복사되었습니다.")

  @action(description="기본 약관 생성", url_path="create-default-terms")
  def create_default_terms(self, request: HttpRequest):
    default_terms = [
      {
        "terms_type": TermsType.TERMS_OF_SERVICE,
        "title": "이용약관",
        "content": "# 이용약관\n\n본 약관은 서비스 이용에 관한 규정입니다.",
        "is_required": True,
      },
      {
        "terms_type": TermsType.PRIVACY_POLICY,
        "title": "개인정보처리방침",
        "content": "# 개인정보처리방침\n\n수집되는 개인정보의 항목, 목적, 보존 기간을 안내합니다.",
        "is_required": True,
      },
      {
        "terms_type": TermsType.AI_TRAINING_DATA,
        "title": "AI 학습 데이터 활용 동의",
        "content": "# AI 학습 데이터 활용 동의\n\n면접 영상·음성 데이터를 AI 모델 개선에 활용하는 것에 동의합니다.",
        "is_required": False,
      },
      {
        "terms_type": TermsType.MARKETING,
        "title": "마케팅 정보 수신 동의",
        "content": "# 마케팅 정보 수신 동의\n\n할인, 프로모션, 이벤트 등 혜택 정보 이메일 발송에 동의합니다.",
        "is_required": False,
      },
    ]

    created_count = 0
    for terms_data in default_terms:
      if not TermsDocument.objects.filter(terms_type=terms_data["terms_type"], published_at__isnull=False).exists():
        TermsDocument.objects.create(**terms_data)
        created_count += 1

    if created_count > 0:
      self.message_user(request, f"기본 약관 {created_count}개가 생성되었습니다.")
    else:
      self.message_user(request, "모든 기본 약관이 이미 존재합니다.", level="warning")

    return redirect(reverse_lazy("admin:terms_documents_termsdocument_changelist"))

  def has_create_default_terms_permission(self, request: HttpRequest):
    return request.user.is_superuser
