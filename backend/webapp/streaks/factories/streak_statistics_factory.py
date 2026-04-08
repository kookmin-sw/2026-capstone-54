import factory
from factory.django import DjangoModelFactory
from streaks.models import StreakStatistics


class StreakStatisticsFactory(DjangoModelFactory):

  class Meta:
    model = StreakStatistics

  user = factory.SubFactory("users.factories.UserFactory")
  current_streak = 0
  longest_streak = 0
  last_participated_date = None
