from django.db import models
from psqlextra.manager import PostgresManager
from psqlextra.query import PostgresQuerySet


class BaseModelQuerySet(PostgresQuerySet):
  pass


class BaseModelManager(PostgresManager.from_queryset(BaseModelQuerySet)):
  pass


class BaseModel(models.Model):

  class Meta:
    abstract = True
    ordering = ["-created_at"]
    get_latest_by = "created_at"
    indexes = [
      models.Index(fields=["-created_at"]),
      models.Index(fields=["-updated_at"]),
    ]
    verbose_name = "Base Model"
    verbose_name_plural = "Base Models"

  objects = BaseModelManager()

  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)

  def assign_attributes(self, attrs: dict[str, any]) -> None:
    self._validate_field_names(attrs)
    for key, value in attrs.items():
      setattr(self, key, value)

  def _validate_field_names(self, attrs: dict[str, any]) -> None:
    model_fields = {f.name for f in self._meta.get_fields()}
    invalid_keys = attrs.keys() - model_fields
    if invalid_keys:
      raise AttributeError(f"Invalid field(s): {invalid_keys}")
