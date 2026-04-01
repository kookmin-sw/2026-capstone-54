from django.db import IntegrityError
from django.test import TestCase
from streaks.factories import StreakStatisticsFactory
from streaks.models import StreakStatistics
from users.factories import UserFactory


class StreakStatisticsModelTests(TestCase):
  """StreakStatistics 모델 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_create_streak_statistics(self):
    """
    StreakStatistics 생성 테스트

    StreakStatistics가 정상적으로 생성되고 사용자와 연결되는지 확인한다.
    - PK가 할당되는지 검증
    - user 관계가 올바르게 설정되는지 검증
    """
    stats = StreakStatisticsFactory(user=self.user)
    self.assertIsNotNone(stats.pk)
    self.assertEqual(stats.user, self.user)

  def test_default_values(self):
    """
    기본값 테스트

    StreakStatistics 생성 시 기본값이 올바르게 설정되는지 확인한다.
    - current_streak: 0
    - longest_streak: 0
    - last_participated_date: None
    """
    stats = StreakStatisticsFactory(user=self.user)
    self.assertEqual(stats.current_streak, 0)
    self.assertEqual(stats.longest_streak, 0)
    self.assertIsNone(stats.last_participated_date)

  def test_one_statistics_per_user(self):
    """
    사용자당 단일 통계 제약 조건 테스트

    동일한 사용자에 대해 StreakStatistics는 하나만 존재할 수 있는지 확인한다.
    - 첫 번째 생성은 성공
    - 동일 사용자로 두 번째 생성 시도 시 IntegrityError 발생
    """
    StreakStatisticsFactory(user=self.user)
    with self.assertRaises(IntegrityError):
      StreakStatisticsFactory(user=self.user)

  def test_string_representation(self):
    """
    문자열 표현 테스트

    __str__ 메서드가 사용자, current_streak, longest_streak 정보를 포함하는지 확인한다.
    - current_streak 값 포함 여부
    - longest_streak 값 포함 여부
    """
    stats = StreakStatisticsFactory(user=self.user, current_streak=5, longest_streak=10)
    result = str(stats)
    self.assertIn("5", result)
    self.assertIn("10", result)

  def test_cascade_delete_with_user(self):
    """
    사용자 삭제 시 CASCADE 동작 테스트

    사용자가 hard_delete()로 삭제될 때 StreakStatistics도 함께 삭제되는지 확인한다.
    - StreakStatistics 생성 후 사용자 삭제
    - StreakStatistics가 더 이상 존재하지 않는지 검증
    """
    StreakStatisticsFactory(user=self.user)
    self.user.hard_delete()
    self.assertEqual(StreakStatistics.objects.filter(pk__isnull=False).count(), 0)
