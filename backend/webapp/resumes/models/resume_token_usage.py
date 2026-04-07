from common.models import BaseModel
from django.conf import settings
from django.db import models
from resumes.enums import OperationType


class ResumeTokenUsage(BaseModel):
  """이력서 관련 OpenAI API 토큰 사용량 추적."""

  class Meta(BaseModel.Meta):
    db_table = "resume_token_usages"
    verbose_name = "Resume Token Usage"
    verbose_name_plural = "Resume Token Usages"
    indexes = BaseModel.Meta.indexes + [
      models.Index(fields=["user_id"], name="resume_tu_user_idx"),
      models.Index(fields=["resume_id"], name="resume_tu_resume_idx"),
      models.Index(fields=["operation_type"], name="resume_tu_op_idx"),
    ]

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="resume_token_usages",
    db_column="user_id",
  )
  resume = models.ForeignKey(
    "resumes.Resume",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="token_usages",
    db_column="resume_id",
  )
  operation_type = models.CharField(
    max_length=20,
    choices=OperationType.choices,
  )
  model_name = models.CharField(max_length=100)
  prompt_tokens = models.IntegerField(default=0)
  total_tokens = models.IntegerField(default=0)

  def __str__(self):
    return (
      f"TokenUsage | {self.operation_type} | {self.model_name}"
      f" | {self.total_tokens} tokens | user={self.user_id}"
    )
