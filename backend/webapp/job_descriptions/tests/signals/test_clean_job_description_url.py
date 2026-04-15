from django.test import TestCase
from job_descriptions.enums import CollectionStatus
from job_descriptions.factories import JobDescriptionFactory


class CleanJobDescriptionUrlSignalTests(TestCase):
  """pre_save signal을 통한 URL 정리 테스트"""

  def test_mark_in_progress시_url_변경_안됨(self):
    """mark_in_progress()는 URL을 건드리지 않는다."""
    jd = JobDescriptionFactory(url="https://example.com/jobs/1")
    original_url = jd.url

    jd.mark_in_progress()
    jd.refresh_from_db()

    self.assertEqual(jd.url, original_url)
    self.assertEqual(jd.collection_status, CollectionStatus.IN_PROGRESS)

  def test_mark_done시_url_변경_안됨(self):
    """mark_done()은 URL을 건드리지 않는다."""
    jd = JobDescriptionFactory(url="https://example.com/jobs/2")
    original_url = jd.url

    jd.mark_done()
    jd.refresh_from_db()

    self.assertEqual(jd.url, original_url)
    self.assertEqual(jd.collection_status, CollectionStatus.DONE)

  def test_mark_error시_url_변경_안됨(self):
    """mark_error()는 URL을 건드리지 않는다."""
    jd = JobDescriptionFactory(url="https://example.com/jobs/3")
    original_url = jd.url

    jd.mark_error("수집 실패")
    jd.refresh_from_db()

    self.assertEqual(jd.url, original_url)
    self.assertEqual(jd.collection_status, CollectionStatus.ERROR)
