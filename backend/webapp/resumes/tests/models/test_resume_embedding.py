from django.test import TestCase
from resumes.factories import ResumeEmbeddingFactory


class ResumeEmbeddingModelTests(TestCase):
  """ResumeEmbedding 모델 테스트."""

  def test_생성(self):
    emb = ResumeEmbeddingFactory()
    self.assertIsNotNone(emb.uuid)
    self.assertEqual(emb.chunk_type, "text")
    self.assertIsNotNone(emb.context)

  def test_resume_관계(self):
    emb = ResumeEmbeddingFactory()
    self.assertIn(emb, emb.resume.embeddings.all())

  def test_소프트_삭제(self):
    emb = ResumeEmbeddingFactory()
    pk = emb.pk
    emb.delete()
    from resumes.models import ResumeEmbedding
    self.assertFalse(ResumeEmbedding.objects.filter(pk=pk).exists())
    self.assertTrue(ResumeEmbedding.all_objects.filter(pk=pk).exists())
