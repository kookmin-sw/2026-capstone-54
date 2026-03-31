from django import forms
from django.contrib import admin
from easymde.widgets import EasyMDEEditor
from terms_documents.models import TermsDocument
from unfold.admin import ModelAdmin


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
