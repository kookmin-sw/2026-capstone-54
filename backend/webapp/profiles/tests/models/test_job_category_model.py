from django.db import IntegrityError
from django.test import TestCase
from profiles.models import JobCategory


class JobCategoryModelTest(TestCase):
  """JobCategory 모델 테스트"""

  def test_create_job_category(self):
    """JobCategory 생성 테스트"""
    job_category = JobCategory.objects.create(emoji="💻", name="IT/개발")

    self.assertEqual(job_category.emoji, "💻")
    self.assertEqual(job_category.name, "IT/개발")
    self.assertIsNotNone(job_category.created_at)
    self.assertIsNotNone(job_category.updated_at)
    self.assertIsNone(job_category.deleted_at)

  def test_job_category_str(self):
    """JobCategory __str__ 메서드 테스트"""
    job_category = JobCategory.objects.create(emoji="📢", name="마케팅")

    self.assertEqual(str(job_category), "📢 마케팅")

  def test_job_category_unique_name(self):
    """JobCategory name 유니크 제약 테스트"""
    JobCategory.objects.create(emoji="💰", name="금융/회계")

    with self.assertRaises(IntegrityError):
      JobCategory.objects.create(emoji="💵", name="금융/회계")

  def test_job_category_ordering(self):
    """JobCategory ordering 테스트"""
    JobCategory.objects.create(emoji="🤝", name="Sales")
    JobCategory.objects.create(emoji="💻", name="IT")
    JobCategory.objects.create(emoji="👥", name="HR")

    categories = list(JobCategory.objects.all())
    names = [c.name for c in categories]

    self.assertEqual(names, ["HR", "IT", "Sales"])

  def test_job_category_soft_delete(self):
    """JobCategory 소프트 삭제 테스트"""
    job_category = JobCategory.objects.create(emoji="💻", name="IT/개발")

    job_category.delete()

    self.assertEqual(JobCategory.objects.count(), 0)
    self.assertEqual(JobCategory.all_objects.count(), 1)

    job_category.refresh_from_db()
    self.assertIsNotNone(job_category.deleted_at)

  def test_job_category_unique_name_allows_reuse_after_soft_delete(self):
    """소프트 삭제 후 같은 이름 재사용 가능 테스트"""
    category1 = JobCategory.objects.create(emoji="💻", name="IT/개발")

    category1.delete()

    category2 = JobCategory.objects.create(emoji="🖥️", name="IT/개발")

    self.assertEqual(category2.name, "IT/개발")
    self.assertEqual(JobCategory.objects.count(), 1)
    self.assertEqual(JobCategory.all_objects.count(), 2)

  def test_job_category_is_opened_property(self):
    """JobCategory is_opened 프로퍼티 테스트"""
    job_category = JobCategory.objects.create(emoji="💻", name="IT/개발")

    # opened_at이 None이면 is_opened는 False
    self.assertIsNone(job_category.opened_at)
    self.assertFalse(job_category.is_opened)

    # opened_at 설정 후 is_opened는 True
    from django.utils import timezone
    job_category.opened_at = timezone.now()
    job_category.save()
    self.assertTrue(job_category.is_opened)
