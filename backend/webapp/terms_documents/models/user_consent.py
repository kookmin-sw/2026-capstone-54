from common.models import BaseModel
from django.db import models


class UserConsent(BaseModel):
  user = models.ForeignKey(
    "users.User",
    on_delete=models.CASCADE,
    related_name="terms_document_consents",
    verbose_name="사용자",
  )
  terms_document = models.ForeignKey(
    "terms_documents.TermsDocument",
    on_delete=models.PROTECT,
    related_name="user_consents",
    verbose_name="약관",
  )
  agreed_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="동의 일시",
  )
  disagreed_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="거절 일시",
  )

  class Meta(BaseModel.Meta):
    verbose_name = "사용자 약관 동의"
    verbose_name_plural = "사용자 약관 동의 목록"
    constraints = [
      models.UniqueConstraint(
        fields=["user", "terms_document"],
        name="unique_user_terms_consent",
      ),
      models.CheckConstraint(
        condition=(models.Q(agreed_at__isnull=True) | models.Q(disagreed_at__isnull=True)),
        name="user_consent_xor",
      ),
    ]

  def __str__(self):
    return f"{self.user} - {self.terms_document}"

  def is_agreed(self) -> bool:
    if self.disagreed_at is None:
      return self.agreed_at is not None
    if self.agreed_at is None:
      return False
    return self.agreed_at >= self.disagreed_at
