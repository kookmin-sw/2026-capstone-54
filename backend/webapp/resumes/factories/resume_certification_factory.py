import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeCertification


class ResumeCertificationFactory(DjangoModelFactory):

  class Meta:
    model = ResumeCertification

  resume = factory.SubFactory(ResumeFactory)
  name = factory.Sequence(lambda n: f"Certification {n}")
  issuer = "Issuer"
  date = "2023-05"
  display_order = 0
