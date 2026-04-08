import factory
from django.utils import timezone
from factory.django import DjangoModelFactory
from terms_documents.enums import TermsType
from terms_documents.models import TermsDocument


class TermsDocumentFactory(DjangoModelFactory):

  class Meta:
    model = TermsDocument

  terms_type = TermsType.TERMS_OF_SERVICE
  title = factory.Sequence(lambda n: f"이용약관 {n}")
  content = factory.Sequence(lambda n: f"# 이용약관\n\n본 약관은 서비스 이용에 관한 규정입니다. ({n})")
  published_at = None
  is_required = True
  effective_at = None

  @classmethod
  def _adjust_kwargs(cls, **kwargs):
    is_published = kwargs.pop("is_published", None)
    if is_published is not None and kwargs.get("published_at") is None:
      kwargs["published_at"] = timezone.now() if is_published else None
    return super()._adjust_kwargs(**kwargs)
