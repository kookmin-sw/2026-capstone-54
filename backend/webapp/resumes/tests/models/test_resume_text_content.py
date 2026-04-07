from django.test import TestCase
from resumes.factories import ResumeTextContentFactory


class ResumeTextContentModelTests(TestCase):
  """ResumeTextContent 모델 테스트."""

  def test_생성(self):
    content = ResumeTextContentFactory()
    self.assertIsNotNone(content.content)
    self.assertEqual(content.user, content.resume.user)

  def test_resume과_one_to_one(self):
    content = ResumeTextContentFactory()
    self.assertEqual(content.resume.text_content, content)

  def test_소프트_삭제(self):
    content = ResumeTextContentFactory()
    pk = content.pk
    content.delete()
    from resumes.models import ResumeTextContent
    self.assertFalse(ResumeTextContent.objects.filter(pk=pk).exists())
    self.assertTrue(ResumeTextContent.all_objects.filter(pk=pk).exists())
