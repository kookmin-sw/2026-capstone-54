from achievements.factories import UserAchievementFactory
from django.db import IntegrityError
from django.test import TestCase


class UserAchievementModelTests(TestCase):

  def test_enforces_unique_user_achievement(self):
    first = UserAchievementFactory()
    with self.assertRaises(IntegrityError):
      UserAchievementFactory(user=first.user, achievement=first.achievement)
