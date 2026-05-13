from django.test import TestCase
from job_descriptions.factories import JobDescriptionFactory


class JobDescriptionModelTests(TestCase):
  """JobDescription 모델 테스트"""

  def test_생성시_utm_파라미터_제거(self):
    """URL에 utm 파라미터가 있으면 생성 시 자동으로 제거된다."""
    jd = JobDescriptionFactory(url="https://example.com/jobs/1?utm_source=google&utm_medium=cpc&page=2", )
    self.assertEqual(jd.url, "https://example.com/jobs/1?page=2")

  def test_생성시_utm_없는_url은_그대로_유지(self):
    """utm 파라미터가 없는 URL은 변경되지 않는다."""
    jd = JobDescriptionFactory(url="https://example.com/jobs/1?page=2", )
    self.assertEqual(jd.url, "https://example.com/jobs/1?page=2")
