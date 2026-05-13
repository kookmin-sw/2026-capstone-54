"""ResumeEmbedding 모델 어드민. CRUD 조회/편집만 담당한다."""

from django.contrib import admin
from resumes.models import ResumeEmbedding
from unfold.admin import ModelAdmin


@admin.register(ResumeEmbedding)
class ResumeEmbeddingAdmin(ModelAdmin):
  """이력서 임베딩 청크 관리 어드민."""

  list_display = ("uuid", "resume", "user", "chunk_type", "chunk_index", "created_at")
  list_filter = ("chunk_type", )
  list_select_related = ("user", "resume")
  search_fields = ("user__email", )
  ordering = ("-created_at", )
  autocomplete_fields = ("user", "resume")

  fieldsets = (
    (None, {
      "fields": (
        "user",
        "resume",
        "chunk_type",
        "chunk_index",
      ),
    }),
    ("임베딩 데이터", {
      "fields": (
        "context",
        "embedding_vector",
      ),
    }),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
      ),
    }),
  )
  readonly_fields = (
    "created_at",
    "updated_at",
  )
