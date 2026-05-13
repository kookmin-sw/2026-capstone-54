from django.contrib import admin
from terms_documents.models import UserConsent
from unfold.admin import ModelAdmin


@admin.register(UserConsent)
class UserConsentAdmin(ModelAdmin):
  list_display = (
    "user",
    "terms_document",
    "agreed_at",
    "created_at",
  )
  list_filter = (
    "user__email",
    "user__name",
    "terms_document__terms_type",
  )
  search_fields = (
    "user__email",
    "user__name",
    "terms_document__title",
  )
  ordering = ("-agreed_at", )
  readonly_fields = (
    "created_at",
    "updated_at",
  )
  autocomplete_fields = (
    "user",
    "terms_document",
  )
