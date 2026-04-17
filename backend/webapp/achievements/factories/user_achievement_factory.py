import factory
from achievements.models import UserAchievement
from django.utils import timezone
from factory.django import DjangoModelFactory


class UserAchievementFactory(DjangoModelFactory):

  class Meta:
    model = UserAchievement

  user = factory.SubFactory("users.factories.UserFactory")
  achievement = factory.SubFactory("achievements.factories.achievement_factory.AchievementFactory")
  achieved_at = factory.LazyFunction(timezone.now)
  achievement_snapshot_payload = {}
  reward_claimed_at = None
  reward_claim_snapshot_payload = {}
