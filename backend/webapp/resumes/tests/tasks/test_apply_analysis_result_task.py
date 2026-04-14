"""ApplyAnalysisResultTask 테스트."""

from django.test import TestCase
from resumes.enums import AnalysisStatus
from resumes.factories import ResumeFactory
from resumes.models import ResumeExperience, ResumeSkill
from resumes.tasks import ApplyAnalysisResultTask

_PAYLOAD = {
  "basic_info": {
    "name": "홍길동"
  },
  "summary": "백엔드",
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


class ApplyAnalysisResultTaskTests(TestCase):
  """resumes.tasks.apply_analysis_result 태스크."""

  def test_applies_parsed_data_and_completes_resume(self):
    """parsed_data payload 를 받으면 Resume 이 completed 되고 정규화 테이블이 채워진다."""
    resume = ResumeFactory(analysis_status=AnalysisStatus.PROCESSING)

    ApplyAnalysisResultTask().run(
      resume_uuid=str(resume.pk),
      parsed_data=_PAYLOAD,
    )

    resume.refresh_from_db()
    self.assertEqual(resume.analysis_status, AnalysisStatus.COMPLETED)
    self.assertEqual(ResumeExperience.objects.filter(resume=resume).count(), 1)
    self.assertEqual(ResumeSkill.objects.filter(resume=resume).count(), 1)
    self.assertIsNotNone(resume.resume_job_category_id)

  def test_ignores_missing_resume(self):
    """존재하지 않는 uuid 는 None 반환."""
    result = ApplyAnalysisResultTask().run(
      resume_uuid="00000000-0000-0000-0000-000000000000",
      parsed_data=_PAYLOAD,
    )
    self.assertIsNone(result)

  def test_task_has_expected_celery_name(self):
    """태스크 이름이 analysis-resume 계약과 일치해야 한다."""
    self.assertEqual(ApplyAnalysisResultTask.name, "resumes.tasks.apply_analysis_result")
