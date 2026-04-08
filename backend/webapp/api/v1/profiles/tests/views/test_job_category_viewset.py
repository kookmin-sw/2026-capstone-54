from django.test import TestCase
from django.utils import timezone
from profiles.factories import JobCategoryFactory
from rest_framework.test import APIClient


class JobCategoryViewSetTest(TestCase):
  """JobCategoryViewSet 단위 테스트"""

  def setUp(self):
    self.client = APIClient()
    opened_at = timezone.now()
    self.categories = [
      JobCategoryFactory(emoji="💻", name="IT/개발", opened_at=opened_at),
      JobCategoryFactory(emoji="📢", name="마케팅", opened_at=opened_at),
      JobCategoryFactory(emoji="💰", name="금융/회계", opened_at=opened_at),
    ]

  def test_job_category_list_returns_all_categories(self):
    """직군 목록 조회 시 모든 카테고리 반환 테스트"""
    response = self.client.get("/api/v1/job-categories/")

    self.assertEqual(response.status_code, 200)
    results = response.data.get("results", response.data)
    self.assertGreaterEqual(len(results), 3)

  def test_job_category_list_is_publicly_accessible(self):
    """직군 목록이 공개 접근 가능한지 테스트"""
    response = self.client.get("/api/v1/job-categories/")

    self.assertEqual(response.status_code, 200)

  def test_job_category_list_ordering(self):
    """직군 목록 정렬 일관성 테스트"""
    response1 = self.client.get("/api/v1/job-categories/")
    response2 = self.client.get("/api/v1/job-categories/")

    self.assertEqual(response1.status_code, 200)
    self.assertEqual(response2.status_code, 200)

    results1 = response1.data.get("results", response1.data)
    results2 = response2.data.get("results", response2.data)

    names1 = [item["name"] for item in results1]
    names2 = [item["name"] for item in results2]

    self.assertEqual(names1, names2)
