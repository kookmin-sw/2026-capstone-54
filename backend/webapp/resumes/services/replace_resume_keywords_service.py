"""이력서 키워드 (N:M) 전체 교체 서비스."""

from common.services import BaseService
from django.db import transaction
from resumes.models import Keyword, ResumeKeyword
from resumes.services.mixins import MarkResumeDirtyMixin


class ReplaceResumeKeywordsService(MarkResumeDirtyMixin, BaseService):

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    texts = list(self.kwargs.get("keywords") or [])

    with transaction.atomic():
      ResumeKeyword.objects.filter(resume=resume).delete()
      for idx, text in enumerate(texts):
        keyword = Keyword.get_or_create_normalized(text)
        if keyword is None:
          continue
        ResumeKeyword.objects.get_or_create(
          resume=resume,
          keyword=keyword,
          defaults={"display_order": idx},
        )

    self._mark_dirty()
    return resume
