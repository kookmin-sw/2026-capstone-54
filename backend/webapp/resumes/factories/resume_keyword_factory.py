import factory
from factory.django import DjangoModelFactory
from resumes.factories.keyword_factory import KeywordFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeKeyword


class ResumeKeywordFactory(DjangoModelFactory):

  class Meta:
    model = ResumeKeyword

  resume = factory.SubFactory(ResumeFactory)
  keyword = factory.SubFactory(KeywordFactory)
  display_order = 0
