import factory
from factory.django import DjangoModelFactory
from resumes.factories.industry_domain_factory import IndustryDomainFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeIndustryDomain


class ResumeIndustryDomainFactory(DjangoModelFactory):

  class Meta:
    model = ResumeIndustryDomain

  resume = factory.SubFactory(ResumeFactory)
  industry_domain = factory.SubFactory(IndustryDomainFactory)
  display_order = 0
