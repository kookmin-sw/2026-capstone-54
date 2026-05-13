from django.test import TestCase
from django.utils import timezone
from profiles.factories import JobCategoryFactory, JobFactory
from rest_framework.test import APIClient


class JobListViewTest(TestCase):
  """JobListView 단위 테스트"""

  def setUp(self):
    self.client = APIClient()
    opened_at = timezone.now()

    self.it_category = JobCategoryFactory(emoji="💻", name="IT/개발", opened_at=opened_at)
    self.marketing_category = JobCategoryFactory(emoji="📢", name="마케팅", opened_at=opened_at)

    self.backend_dev = JobFactory(name="백엔드 개발자", category=self.it_category, opened_at=opened_at)
    self.frontend_dev = JobFactory(name="프론트엔드 개발자", category=self.it_category, opened_at=opened_at)

    self.marketer = JobFactory(name="마케터", category=self.marketing_category, opened_at=opened_at)

  def test_job_list_returns_jobs_in_category(self):
    """직군 ID path param으로 해당 직군의 직업 목록만 반환"""
    response = self.client.get(f"/api/v1/job-categories/{self.it_category.id}/jobs/")

    self.assertEqual(response.status_code, 200)
    self.assertEqual(len(response.data["results"]), 2)

    job_ids = [item["id"] for item in response.data["results"]]
    self.assertIn(self.backend_dev.id, job_ids)
    self.assertIn(self.frontend_dev.id, job_ids)
    self.assertNotIn(self.marketer.id, job_ids)

  def test_job_list_with_non_existent_category_returns_empty_list(self):
    """존재하지 않는 직군 ID로 요청 시 빈 목록 반환"""
    response = self.client.get("/api/v1/job-categories/99999/jobs/")

    self.assertEqual(response.status_code, 200)
    self.assertEqual(len(response.data["results"]), 0)

  def test_autocomplete_with_query_returns_similar_jobs(self):
    """?search= 검색어로 요청 시 유사한 직업 반환"""
    response = self.client.get(f"/api/v1/job-categories/{self.it_category.id}/jobs/?search=개발")

    self.assertEqual(response.status_code, 200)
    self.assertGreater(len(response.data["results"]), 0)

  def test_autocomplete_limits_results_to_10(self):
    """?search= 자동완성 결과가 10개로 제한"""
    opened_at = timezone.now()
    for i in range(20):
      JobFactory(name=f"개발자 {i}", category=self.it_category, opened_at=opened_at)

    response = self.client.get(f"/api/v1/job-categories/{self.it_category.id}/jobs/?search=개발")

    self.assertEqual(response.status_code, 200)
    self.assertLessEqual(len(response.data["results"]), 10)
