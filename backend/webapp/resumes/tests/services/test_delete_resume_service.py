from django.test import TestCase
from resumes.factories import TextResumeFactory
from resumes.models import Resume
from resumes.services import DeleteResumeService
from users.factories import UserFactory


class DeleteResumeServiceTests(TestCase):
  """DeleteResumeService 단위 테스트."""

  def setUp(self):
    self.user = UserFactory()
    self.resume = TextResumeFactory(user=self.user, title="삭제 대상 이력서")

  def test_soft_delete_후_deleted_at_기록(self):
    """soft delete 수행 후 deleted_at 필드에 타임스탬프가 기록된다."""
    DeleteResumeService(resume=self.resume).perform()

    resume = Resume.all_objects.get(pk=self.resume.pk)
    self.assertIsNotNone(resume.deleted_at)

  def test_soft_delete_후_objects_매니저에서_제외(self):
    """soft delete 후 기본 매니저(objects)로 조회 시 해당 이력서가 제외된다."""
    DeleteResumeService(resume=self.resume).perform()

    self.assertFalse(Resume.objects.filter(pk=self.resume.pk).exists())

  def test_soft_delete_후_all_objects_매니저에서_포함(self):
    """soft delete 후 all_objects 매니저로 조회 시 해당 이력서가 포함된다."""
    DeleteResumeService(resume=self.resume).perform()

    self.assertTrue(Resume.all_objects.filter(pk=self.resume.pk).exists())
