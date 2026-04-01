import factory
from factory.django import DjangoModelFactory
from streaks.models import DailyInterviewRewardPolicy


class DailyInterviewRewardPolicyFactory(DjangoModelFactory):

  class Meta:
    model = DailyInterviewRewardPolicy

  interview_order = factory.Sequence(lambda n: n + 1)
  ticket_reward = 3
  is_active = True
