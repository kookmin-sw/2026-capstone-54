from unittest.mock import patch

from django.test import TestCase
from resumes.enums import AnalysisStatus
from resumes.factories import ResumeEmbeddingFactory, ResumeFactory
from resumes.models import ResumeTokenUsage
from resumes.services import SearchResumeEmbeddingService
from users.factories import UserFactory

FAKE_VECTOR = [0.1] * 1536


class SearchResumeEmbeddingServiceTests(TestCase):
  """SearchResumeEmbeddingService 테스트."""

  def setUp(self):
    self.user = UserFactory()
    self.resume = ResumeFactory(
      user=self.user,
      analysis_status=AnalysisStatus.COMPLETED,
      is_active=True,
    )
    # 임베딩 레코드 생성 (벡터 포함)
    self.embedding = ResumeEmbeddingFactory(
      user=self.user,
      resume=self.resume,
      embedding_vector=FAKE_VECTOR,
      context="Python Django 백엔드 개발",
    )

  @patch("resumes.services.search_resume_embedding_service.embed_query", return_value=(FAKE_VECTOR, 5))
  def test_검색_결과_반환(self, mock_embed):
    """유사도 검색 결과가 반환된다."""
    results = SearchResumeEmbeddingService(
      user=self.user,
      keyword="Python",
      resume_uuid=str(self.resume.pk),
    ).perform()

    self.assertIsInstance(results, list)
    mock_embed.assert_called_once_with("Python")

  @patch("resumes.services.search_resume_embedding_service.embed_query", return_value=(FAKE_VECTOR, 5))
  def test_토큰_사용량_기록(self, mock_embed):
    """검색 시 토큰 사용량이 기록된다."""
    SearchResumeEmbeddingService(
      user=self.user,
      keyword="Django",
      resume_uuid=str(self.resume.pk),
    ).perform()

    self.assertTrue(ResumeTokenUsage.objects.filter(user=self.user).exists())
    usage = ResumeTokenUsage.objects.get(user=self.user)
    self.assertEqual(usage.operation_type, "search")
    self.assertEqual(usage.resume_id, self.resume.pk)

  @patch("resumes.services.search_resume_embedding_service.embed_query", return_value=(FAKE_VECTOR, 5))
  def test_record_usage_false시_기록안함(self, mock_embed):
    """record_usage=False이면 토큰 사용량을 기록하지 않는다."""
    SearchResumeEmbeddingService(
      user=self.user,
      keyword="Django",
      resume_uuid=str(self.resume.pk),
      record_usage=False,
    ).perform()

    self.assertFalse(ResumeTokenUsage.objects.filter(user=self.user).exists())

  @patch("resumes.services.search_resume_embedding_service.embed_query", return_value=(FAKE_VECTOR, 5))
  def test_threshold_0이면_모든_결과(self, mock_embed):
    """threshold=0.0이면 distance에 관계없이 결과를 반환한다."""
    results = SearchResumeEmbeddingService(
      user=self.user,
      keyword="anything",
      resume_uuid=str(self.resume.pk),
      similarity_threshold=0.0,
    ).perform()

    # 벡터가 동일하므로 distance=0, similarity=1.0
    self.assertEqual(len(results), 1)
    self.assertEqual(results[0]["similarity"], 1.0)
