import factory
from factory.django import DjangoModelFactory
from profiles.factories.job_category_factory import JobCategoryFactory
from profiles.models import Job


class JobFactory(DjangoModelFactory):

  class Meta:
    model = Job

  name = factory.Sequence(lambda n: f"직업{n}")
  category = factory.SubFactory(JobCategoryFactory)
