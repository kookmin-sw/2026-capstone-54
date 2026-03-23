import uuid

from django.db import models

from .base_model import BaseModel


class BaseModelWithUUID(BaseModel):
  uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

  class Meta:
    abstract = True
    verbose_name = "Base Model with UUID"
    verbose_name_plural = "Base Models with UUID"
