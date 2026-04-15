"""이력서 산업 도메인 (N:M) 전체 교체 서비스."""

from common.services import BaseService
from django.db import transaction
from resumes.models import IndustryDomain, ResumeIndustryDomain
from resumes.services.mixins import MarkResumeDirtyMixin


class ReplaceResumeIndustryDomainsService(MarkResumeDirtyMixin, BaseService):

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    names = list(self.kwargs.get("industry_domains") or [])

    with transaction.atomic():
      ResumeIndustryDomain.objects.filter(resume=resume).delete()
      for idx, name in enumerate(names):
        domain = IndustryDomain.get_or_create_normalized(name)
        if domain is None:
          continue
        ResumeIndustryDomain.objects.get_or_create(
          resume=resume,
          industry_domain=domain,
          defaults={"display_order": idx},
        )

    self._mark_dirty()
    return resume
