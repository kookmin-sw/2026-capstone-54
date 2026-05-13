from datetime import date

from django.db import IntegrityError
from django.test import TestCase
from streaks.factories import StreakLogFactory
from streaks.models import StreakLog
from users.factories import UserFactory


class StreakLogModelTests(TestCase):
  """StreakLog 모델 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_create_streak_log(self):
    """
    StreakLog 생성 테스트

    StreakLog가 정상적으로 생성되고 기본값이 올바르게 설정되는지 확인한다.
    - PK가 할당되는지 검증
    - interview_results_count 기본값 검증
    """
    log = StreakLogFactory(user=self.user, date=date(2025, 3, 1))
    self.assertIsNotNone(log.pk)
    self.assertEqual(log.interview_results_count, 1)

  def test_unique_constraint_user_and_date(self):
    """
    사용자-날짜 유니크 제약 조건 테스트

    동일한 (user, date) 쌍으로 중복 생성이 불가능한지 확인한다.
    - 첫 번째 생성은 성공
    - 동일한 조합으로 두 번째 생성 시도 시 IntegrityError 발생
    """
    StreakLogFactory(user=self.user, date=date(2025, 3, 1))
    with self.assertRaises(IntegrityError):
      StreakLogFactory(user=self.user, date=date(2025, 3, 1))

  def test_different_users_can_have_same_date_logs(self):
    """
    다른 사용자의 동일 날짜 로그 생성 테스트

    서로 다른 사용자는 같은 날짜에 각자의 StreakLog를 가질 수 있는지 확인한다.
    - 두 명의 사용자가 같은 날짜에 로그 생성
    - 해당 날짜의 로그가 2개 존재하는지 검증
    """
    other_user = UserFactory()
    StreakLogFactory(user=self.user, date=date(2025, 3, 1))
    StreakLogFactory(user=other_user, date=date(2025, 3, 1))
    self.assertEqual(StreakLog.objects.filter(date=date(2025, 3, 1)).count(), 2)

  def test_string_representation(self):
    """
    문자열 표현 테스트

    __str__ 메서드가 사용자, 날짜, 면접 횟수 정보를 포함하는지 확인한다.
    - 날짜 정보 포함 여부
    - 면접 횟수 정보 포함 여부
    """
    log = StreakLogFactory(user=self.user, date=date(2025, 3, 1), interview_results_count=3)
    result = str(log)
    self.assertIn("2025-03-01", result)
    self.assertIn("3", result)
