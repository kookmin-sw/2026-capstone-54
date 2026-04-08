from django.test import TestCase
from resumes.factories import ResumeFileContentFactory


class ResumeFileContentModelTests(TestCase):
  """ResumeFileContent 모델 테스트."""

  def test_생성(self):
    content = ResumeFileContentFactory()
    self.assertEqual(content.original_filename, "resume.pdf")
    self.assertEqual(content.mime_type, "application/pdf")

  def test_resume과_one_to_one(self):
    content = ResumeFileContentFactory()
    self.assertEqual(content.resume.file_content, content)

  def test_소프트_삭제(self):
    content = ResumeFileContentFactory()
    pk = content.pk
    content.delete()
    from resumes.models import ResumeFileContent
    self.assertFalse(ResumeFileContent.objects.filter(pk=pk).exists())
    self.assertTrue(ResumeFileContent.all_objects.filter(pk=pk).exists())
