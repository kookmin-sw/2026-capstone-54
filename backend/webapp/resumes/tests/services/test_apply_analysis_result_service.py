"""ApplyAnalysisResultService 테스트."""

from django.test import TestCase
from resumes.enums import AnalysisStatus, AnalysisStep
from resumes.factories import ResumeFactory
from resumes.models import (
  ResumeEmbedding,
  ResumeExperience,
  ResumeSkill,
  ResumeTokenUsage,
)
from resumes.services.apply_analysis_result_service import ApplyAnalysisResultService

_MIN_PARSED = {
  "basic_info": {
    "name": "홍길동"
  },
  "summary": "백엔드 개발자입니다.",
  "skills": {
    "technical": ["Python"],
    "soft": [],
    "tools": [],
    "languages": []
  },
  "experiences": [
    {
      "company": "ACME",
      "role": "Backend",
      "period": "2022-2024",
      "responsibilities": [],
      "highlights": [],
    }
  ],
  "job_category": "IT/개발",
}


class ApplyAnalysisResultServiceTests(TestCase):
  """ApplyAnalysisResultService 단위 테스트."""

  def setUp(self):
    self.resume = ResumeFactory()

  def test_marks_resume_completed_and_writes_parsed_data(self):
    """서비스 실행 후 Resume 은 completed 상태가 되고 정규화 sub-model 이 채워진다."""
    ApplyAnalysisResultService(
      resume=self.resume,
      parsed_data=_MIN_PARSED,
    ).perform()

    self.resume.refresh_from_db()
    self.assertEqual(self.resume.analysis_status, AnalysisStatus.COMPLETED)
    self.assertEqual(self.resume.analysis_step, AnalysisStep.DONE)
    self.assertTrue(self.resume.is_parsed)
    self.assertIsNotNone(self.resume.analyzed_at)
    # backward-compat JSONField 에도 기록됨
    self.assertEqual(self.resume.parsed_data["summary"], "백엔드 개발자입니다.")
    # 정규화 테이블에도 기록됨
    self.assertEqual(ResumeExperience.objects.filter(resume=self.resume).count(), 1)
    self.assertEqual(ResumeSkill.objects.filter(resume=self.resume).count(), 1)
    # 직군 FK 연결 확인
    self.assertIsNotNone(self.resume.resume_job_category_id)

  def test_writes_token_usages_when_provided(self):
    """payload 에 token_usages 가 있으면 ResumeTokenUsage 에 기록된다."""
    ApplyAnalysisResultService(
      resume=self.resume,
      parsed_data=_MIN_PARSED,
      token_usages=[
        {
          "operation_type": "analyze",
          "model_name": "gpt-4o-mini",
          "prompt_tokens": 100,
          "total_tokens": 150,
        },
      ],
    ).perform()

    usages = ResumeTokenUsage.objects.filter(resume=self.resume)
    self.assertEqual(usages.count(), 1)
    self.assertEqual(usages.first().total_tokens, 150)

  def test_writes_embeddings_when_provided(self):
    """payload 에 embeddings 가 있으면 ResumeEmbedding 에 bulk 저장된다."""
    vector = [0.0] * 1536
    ApplyAnalysisResultService(
      resume=self.resume,
      parsed_data=_MIN_PARSED,
      embeddings=[
        {
          "context": "chunk-1",
          "vector": vector,
          "chunk_type": "text",
          "chunk_index": 0
        },
        {
          "context": "chunk-2",
          "vector": vector,
          "chunk_type": "text",
          "chunk_index": 1
        },
      ],
    ).perform()

    self.assertEqual(ResumeEmbedding.objects.filter(resume=self.resume).count(), 2)

  def test_parsed_data_none_takes_reembed_path(self):
    """parsed_data 가 None 이면 sub-model 을 갱신하지 않고 재임베딩 경로(mark_finalized)를 탄다."""
    ApplyAnalysisResultService(
      resume=self.resume,
      parsed_data=None,
      embeddings=[],
    ).perform()

    self.resume.refresh_from_db()
    self.assertFalse(self.resume.is_dirty)
    self.assertIsNotNone(self.resume.last_finalized_at)
