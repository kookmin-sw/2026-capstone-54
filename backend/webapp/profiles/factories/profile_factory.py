import factory
from factory.django import DjangoModelFactory
from profiles.factories.job_category_factory import JobCategoryFactory
from profiles.models import Profile
from users.factories.user_factory import UserFactory


class ProfileFactory(DjangoModelFactory):

  class Meta:
    model = Profile

  user = factory.SubFactory(UserFactory)
  job_category = factory.SubFactory(JobCategoryFactory)
