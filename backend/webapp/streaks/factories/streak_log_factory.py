import factory
from django.utils import timezone
from factory.django import DjangoModelFactory
from streaks.models import StreakLog


class StreakLogFactory(DjangoModelFactory):

  class Meta:
    model = StreakLog

  user = factory.SubFactory("users.factories.UserFactory")
  log_date = factory.LazyFunction(timezone.localdate)
  interview_results_count = 1
