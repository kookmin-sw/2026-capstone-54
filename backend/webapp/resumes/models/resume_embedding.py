import uuid

from common.models import BaseModelWithSoftDelete
from django.conf import settings
from django.db import models
from pgvector.django import VectorField
from resumes.enums import ChunkType

OPENAI_EMBEDDING_DIMENSIONS = 1536


class ResumeEmbedding(BaseModelWithSoftDelete):
  """이력서 청크별 벡터 임베딩. pgvector extension 활용."""

  class Meta(BaseModelWithSoftDelete.Meta):
    db_table = "resume_embeddings"
    verbose_name = "Resume Embedding"
    verbose_name_plural = "Resume Embeddings"
    indexes = BaseModelWithSoftDelete.Meta.indexes + [
      models.Index(fields=["resume_id"], name="resume_emb_resume_idx"),
      models.Index(fields=["user_id"], name="resume_emb_user_idx"),
    ]

  uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="embeddings",
    db_column="resume_id",
  )
  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="resume_embeddings",
    db_column="user_id",
  )
  embedding_vector = VectorField(
    dimensions=OPENAI_EMBEDDING_DIMENSIONS,
    null=True,
    blank=True,
  )
  context = models.TextField(help_text="임베딩 대상 텍스트 청크 원문")
  chunk_type = models.CharField(
    max_length=20,
    choices=ChunkType.choices,
    default=ChunkType.TEXT,
  )
  chunk_index = models.IntegerField(default=0, help_text="청크 순서 (0-based)")

  def __str__(self):
    return f"ResumeEmbedding {self.uuid} | resume={self.resume_id} | {self.chunk_type}[{self.chunk_index}]"
