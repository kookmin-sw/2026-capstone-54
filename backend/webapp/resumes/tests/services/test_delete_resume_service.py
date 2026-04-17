from common.exceptions import ConflictException
from django.test import TestCase
from resumes.enums import AnalysisStatus
from resumes.factories import TextResumeFactory
from resumes.models import Resume
from resumes.services import DeleteResumeService
from users.factories import UserFactory


class DeleteResumeServiceTests(TestCase):
  """DeleteResumeService 단위 테스트."""

  def setUp(self):
    self.user = UserFactory()
    self.resume = TextResumeFactory(user=self.user, title="삭제 대상 이력서")
    self.resume.analysis_status = AnalysisStatus.COMPLETED
    self.resume.save(update_fields=["analysis_status"])

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

  def test_analysis_pending_resume_deletion_raises_conflict(self):
    """분석 대기 중(pending) 이력서 삭제 시 ConflictException이 발생한다."""
    self.resume.analysis_status = AnalysisStatus.PENDING
    self.resume.save(update_fields=["analysis_status"])

    with self.assertRaises(ConflictException):
      DeleteResumeService(resume=self.resume).perform()

  def test_analysis_processing_resume_deletion_raises_conflict(self):
    """분석 중(processing) 이력서 삭제 시 ConflictException이 발생한다."""
    self.resume.analysis_status = AnalysisStatus.PROCESSING
    self.resume.save(update_fields=["analysis_status"])

    with self.assertRaises(ConflictException):
      DeleteResumeService(resume=self.resume).perform()
