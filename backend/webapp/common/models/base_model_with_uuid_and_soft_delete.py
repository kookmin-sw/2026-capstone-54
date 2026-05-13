import uuid

from django.db import models

from .base_model_with_soft_delete import BaseModelWithSoftDelete


class BaseModelWithUUIDAndSoftDelete(BaseModelWithSoftDelete):
  """UUID PK + Soft Delete를 모두 지원하는 베이스 모델."""

  uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

  class Meta(BaseModelWithSoftDelete.Meta):
    abstract = True
    verbose_name = "Base Model with UUID and Soft Delete"
    verbose_name_plural = "Base Models with UUID and Soft Delete"
