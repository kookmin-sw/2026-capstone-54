import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeExperience


class ResumeExperienceFactory(DjangoModelFactory):

  class Meta:
    model = ResumeExperience

  resume = factory.SubFactory(ResumeFactory)
  company = factory.Sequence(lambda n: f"Company {n}")
  role = "Backend Engineer"
  period = "2022-2024"
  responsibilities = factory.LazyFunction(list)
  highlights = factory.LazyFunction(list)
  display_order = 0
