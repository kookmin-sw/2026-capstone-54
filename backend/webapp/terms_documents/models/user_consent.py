from django.db import models
from common.models import BaseModel


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
  agreed_at = models.DateTimeField(verbose_name="동의 일시")

  class Meta(BaseModel.Meta):
    verbose_name = "사용자 약관 동의"
    verbose_name_plural = "사용자 약관 동의 목록"
    constraints = [
      models.UniqueConstraint(
        fields=["user", "terms_document"],
        name="unique_user_terms_consent",
      )
    ]

  def __str__(self):
    return f"{self.user} - {self.terms_document}"
