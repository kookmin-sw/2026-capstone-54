from datetime import date

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from streaks.factories import StreakLogFactory, StreakStatisticsFactory
from streaks.models import StreakStatistics
from users.factories import UserFactory


class StreakStatisticsAPIViewTests(TestCase):
  """GET /api/v1/streaks/statistics/ 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    self.user.email_confirmed_at = timezone.now()
    self.user.save(update_fields=["email_confirmed_at"])
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.url = reverse("streak-statistics")

  def test_인증_없이_요청시_401(self):
    """인증되지 않은 요청은 401을 반환한다"""
    self.client.credentials()
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_스트릭_없는_신규_사용자_200_반환(self):
    """StreakStatistics가 없는 사용자도 200을 반환하며 기본값을 내려준다"""
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["current_streak"], 0)
    self.assertEqual(response.data["longest_streak"], 0)
    self.assertIsNone(response.data["last_participated_date"])

  def test_신규_사용자_StreakStatistics_자동_생성(self):
    """GET 요청 시 StreakStatistics가 없으면 자동으로 생성된다"""
    self.client.get(self.url)
    self.assertTrue(StreakStatistics.objects.filter(user=self.user).exists())

  def test_통계_데이터_반환(self):
    """current_streak, longest_streak, last_participated_date가 올바르게 반환된다"""
    StreakStatisticsFactory(
      user=self.user,
      current_streak=5,
      longest_streak=10,
      last_participated_date=date(2025, 3, 9),
    )
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["current_streak"], 5)
    self.assertEqual(response.data["longest_streak"], 10)
    self.assertEqual(response.data["last_participated_date"], "2025-03-09")


class StreakLogsAPIViewTests(TestCase):
  """GET /api/v1/streaks/logs/ 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    self.user.email_confirmed_at = timezone.now()
    self.user.save(update_fields=["email_confirmed_at"])
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.url = reverse("streak-logs")

  def test_returns_logs_in_date_range(self):
    StreakLogFactory(user=self.user, date=date(2025, 3, 1), interview_results_count=2)
    StreakLogFactory(user=self.user, date=date(2025, 3, 15), interview_results_count=1)
    StreakLogFactory(user=self.user, date=date(2025, 2, 28), interview_results_count=1)

    response = self.client.get(self.url, {"start_date": "2025-03-01", "end_date": "2025-03-31"})
    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data["logs"]), 2)

  def test_returns_400_when_date_format_invalid(self):
    response = self.client.get(self.url, {"start_date": "2025/03/01", "end_date": "2025-03-31"})
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_returns_400_when_start_date_after_end_date(self):
    response = self.client.get(self.url, {"start_date": "2025-04-01", "end_date": "2025-03-31"})
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_orders_logs_by_date_ascending(self):
    StreakLogFactory(user=self.user, date=date(2025, 3, 20))
    StreakLogFactory(user=self.user, date=date(2025, 3, 5))
    StreakLogFactory(user=self.user, date=date(2025, 3, 12))

    response = self.client.get(self.url, {"start_date": "2025-03-01", "end_date": "2025-03-31"})
    dates = [log["date"] for log in response.data["logs"]]
    self.assertEqual(dates, sorted(dates))

  def test_excludes_other_users_logs(self):
    other_user = UserFactory()
    StreakLogFactory(user=other_user, date=date(2025, 3, 1))

    response = self.client.get(self.url, {"start_date": "2025-03-01", "end_date": "2025-03-31"})
    self.assertEqual(response.data["logs"], [])
