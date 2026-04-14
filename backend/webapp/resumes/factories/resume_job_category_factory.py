import factory
from factory.django import DjangoModelFactory
from resumes.models import ResumeJobCategory


class ResumeJobCategoryFactory(DjangoModelFactory):

  class Meta:
    model = ResumeJobCategory
    django_get_or_create = ("name", )

  name = factory.Sequence(lambda n: f"직군 {n}")
  emoji = ""
  description = ""
