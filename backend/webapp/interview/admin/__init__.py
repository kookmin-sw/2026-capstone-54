from django.contrib import admin
from interview.models import InterviewExchange, InterviewSession
from unfold.admin import ModelAdmin, TabularInline


class InterviewExchangeInline(TabularInline):
  model = InterviewExchange
  extra = 0
  fields = ("id", "exchange_type", "depth", "question", "answer", "total_tokens", "created_at")
  readonly_fields = ("id", "created_at")
  ordering = ("id", )


USD_TO_KRW = 1450


@admin.register(InterviewSession)
class InterviewSessionAdmin(ModelAdmin):
  list_display = (
    "id",
    "model_name",
    "difficulty_level",
    "status",
    "is_auto",
    "total_initial_questions",
    "total_followup_questions",
    "total_tokens",
    "cost_display",
    "duration_seconds",
    "created_at",
  )
  list_filter = ("status", "is_auto", "model_name", "difficulty_level")
  search_fields = ("model_name", "resume_file", "job_posting_file")
  ordering = ("-created_at", )
  inlines = (InterviewExchangeInline, )

  fieldsets = (
    (None, {
      "fields": ("model_name", "difficulty_level", "status", "is_auto"),
    }),
    ("시간", {
      "fields": ("started_at", "finished_at", "duration_seconds"),
    }),
    ("질문 & 답변 통계", {
      "fields": ("total_initial_questions", "total_followup_questions", "avg_answer_length"),
    }),
    (
      "토큰 사용량", {
        "fields": ("total_input_tokens", "total_output_tokens", "total_tokens", "total_cost_usd", "cost_display"),
      }
    ),
    ("문서 & RAG", {
      "fields": ("resume_file", "job_posting_file", "total_chunks_retrieved"),
    }),
    ("날짜", {
      "fields": ("created_at", "updated_at"),
    }),
  )
  readonly_fields = ("created_at", "updated_at", "cost_display")

  @admin.display(description="비용 (USD / 원화)")
  def cost_display(self, obj):
    usd = float(obj.total_cost_usd)
    krw = usd * USD_TO_KRW
    return f"${usd:.6f} (약 {krw:.1f}원)"


@admin.register(InterviewExchange)
class InterviewExchangeAdmin(ModelAdmin):
  list_display = ("id", "session", "exchange_type", "depth", "total_tokens", "created_at")
  list_filter = ("exchange_type", "session")
  search_fields = ("question", "answer")
  ordering = ("-created_at", )
  autocomplete_fields = ("session", )

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
