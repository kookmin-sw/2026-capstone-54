from django.test import TestCase
from profiles.models import Job, JobCategory


class JobModelTest(TestCase):
  """Job 모델 테스트"""

  def setUp(self):
    self.category = JobCategory.objects.create(emoji="💻", name="IT/개발")

  def test_job_foreign_key_to_job_category(self):
    """Job과 JobCategory의 외래키 관계 테스트"""
    job = Job.objects.create(name="백엔드 개발자", category=self.category)

    self.assertEqual(job.category, self.category)
    self.assertIn(job, self.category.jobs.all())

  def test_job_soft_delete(self):
    """Job 소프트 삭제 테스트"""
    job = Job.objects.create(name="백엔드 개발자", category=self.category)

    job.delete()

    self.assertEqual(Job.objects.count(), 0)
    self.assertEqual(Job.all_objects.count(), 1)

  def test_job_str(self):
    """Job __str__ 메서드 테스트"""
    job = Job.objects.create(name="백엔드 개발자", category=self.category)

    self.assertEqual(str(job), "백엔드 개발자 (IT/개발)")

  def test_job_is_opened_property(self):
    """Job is_opened 프로퍼티 테스트"""
    job = Job.objects.create(name="백엔드 개발자", category=self.category)

    # opened_at이 None이면 is_opened는 False
    self.assertIsNone(job.opened_at)
    self.assertFalse(job.is_opened)

    # opened_at 설정 후 is_opened는 True
    from django.utils import timezone
    job.opened_at = timezone.now()
    job.save()
    self.assertTrue(job.is_opened)
