from django.db import models
from django.db import transaction
from django.db.models import Max

from common.db import run_with_integrity_retry
from common.models import BaseModel, BaseModelManager, BaseModelQuerySet
from terms_documents.enums import TermsType

class TermsDocumentQuerySet(BaseModelQuerySet):
  def published(self):
    return self.filter(published_at__isnull=False)


class TermsDocumentManager(BaseModelManager.from_queryset(TermsDocumentQuerySet)):
  pass


class TermsDocument(BaseModel):
  VERSION_ASSIGN_MAX_RETRIES = 3

  terms_type = models.CharField(
    max_length=50,
    choices=TermsType.choices,
    verbose_name="약관 유형",
  )
  version = models.PositiveIntegerField(
    verbose_name="버전",
    editable=False,
  )

  title = models.CharField(
    max_length=200,
    verbose_name="제목",
  )
  content = models.TextField(
    verbose_name="내용 (마크다운)",
  )  
  
  is_required = models.BooleanField(
    default=True,
    verbose_name="필수 동의 여부",
  )
  
  published_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="공개일시",
  )

  effective_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="적용일",
  )

  objects = TermsDocumentManager()

  class Meta(BaseModel.Meta):
    verbose_name = "약관"
    verbose_name_plural = "약관 목록"
    ordering = ["terms_type", "-version"]
    constraints = [
      models.UniqueConstraint(
        fields=["terms_type"],
        condition=models.Q(published_at__isnull=False),
        name="unique_published_terms_per_type",
      ),
      models.UniqueConstraint(
        fields=["terms_type", "version"],
        name="unique_terms_type_version",
      ),
    ]

  def save(self, *args, **kwargs):
    if self.pk:
      super().save(*args, **kwargs)
      return

    def save_new_terms_document():
      max_version = (
        TermsDocument.objects.filter(terms_type=self.terms_type)
        .aggregate(max=Max("version"))["max"]
        or 0
      )
      self.version = max_version + 1
      with transaction.atomic():
        return super(TermsDocument, self).save(*args, **kwargs)

    run_with_integrity_retry(
      save_new_terms_document,
      max_retries=self.VERSION_ASSIGN_MAX_RETRIES,
      final_error_message="약관 버전 할당 중 버전 충돌이 반복되어 저장에 실패했습니다.",
    )

  @property
  def is_published(self):
    return self.published_at is not None

  def __str__(self):
    return f"[{self.get_terms_type_display()}] {self.title} (v{self.version})"
