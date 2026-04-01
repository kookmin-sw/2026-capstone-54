from django.contrib import admin
from interview.models import InterviewExchange, InterviewSession
from unfold.admin import ModelAdmin, TabularInline


class InterviewExchangeInline(TabularInline):
  model = InterviewExchange
  extra = 0
  fields = ("id", "exchange_type", "depth", "question", "answer", "total_tokens", "created_at")
  readonly_fields = ("id", "created_at")
  ordering = ("id", )


@admin.register(InterviewSession)
class InterviewSessionAdmin(ModelAdmin):
  list_display = ("id", "model_name", "difficulty_level", "is_auto", "total_tokens", "total_cost_usd", "created_at")
  list_filter = ("is_auto", "model_name", "difficulty_level")
  search_fields = ("model_name", )
  ordering = ("-created_at", )
  inlines = (InterviewExchangeInline, )

  fieldsets = (
    (None, {
      "fields": ("model_name", "difficulty_level", "is_auto"),
    }),
    ("토큰 사용량", {
      "fields": ("total_input_tokens", "total_output_tokens", "total_tokens", "total_cost_usd"),
    }),
    ("날짜", {
      "fields": ("created_at", "updated_at"),
    }),
  )
  readonly_fields = ("created_at", "updated_at")


@admin.register(InterviewExchange)
class InterviewExchangeAdmin(ModelAdmin):
  list_display = ("id", "session", "exchange_type", "depth", "total_tokens", "created_at")
  list_filter = ("exchange_type", "session")
  search_fields = ("question", "answer")
  ordering = ("-created_at", )

  fieldsets = (
    (None, {
      "fields": ("session", "exchange_type", "depth"),
    }),
    ("질문/답변", {
      "fields": ("question", "answer"),
    }),
    ("토큰 사용량", {
      "fields": ("input_tokens", "output_tokens", "total_tokens"),
    }),
    ("날짜", {
      "fields": ("created_at", "updated_at"),
    }),
  )
  readonly_fields = ("created_at", "updated_at")
