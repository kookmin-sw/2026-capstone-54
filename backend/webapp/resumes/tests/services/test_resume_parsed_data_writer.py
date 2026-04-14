"""ResumeParsedDataWriter 테스트."""

from django.test import TestCase
from resumes.enums import SkillType
from resumes.factories import ResumeFactory
from resumes.models import (
  ResumeBasicInfo,
  ResumeCareerMeta,
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeIndustryDomain,
  ResumeJobCategory,
  ResumeKeyword,
  ResumeLanguageSpoken,
  ResumeProject,
  ResumeProjectTechStack,
  ResumeSkill,
  ResumeSummary,
  Skill,
)
from resumes.services.resume_parsed_data_writer import ResumeParsedDataWriter

_FULL_PARSED = {
  "basic_info": {
    "name": "홍길동",
    "email": "hong@example.com",
    "phone": "010-1111-2222",
    "location": "Seoul",
  },
  "summary": "백엔드 개발자입니다.",
  "skills": {
    "technical": ["Python", "Django"],
    "soft": ["커뮤니케이션"],
    "tools": ["Docker"],
    "languages": ["English"],
  },
  "experiences": [
    {
      "company": "ACME",
      "role": "Backend",
      "period": "2022-2024",
      "responsibilities": ["API 설계"],
      "highlights": ["QPS 3배"],
    },
  ],
  "educations": [
    {
      "school": "KMU",
      "degree": "학사",
      "major": "CS",
      "period": "2016-2020"
    },
  ],
  "certifications": [
    {
      "name": "AWS SAA",
      "issuer": "AWS",
      "date": "2023-05"
    },
  ],
  "projects": [
    {
      "name": "Nova",
      "role": "Lead",
      "period": "2023",
      "description": "플랫폼 리팩터",
      "tech_stack": ["Go", "Kafka"],
    },
  ],
  "languages_spoken": [{
    "language": "English",
    "level": "Business"
  }],
  "total_experience_years": 5,
  "total_experience_months": 6,
  "industry_domains": ["핀테크", "이커머스"],
  "keywords": ["microservices", "pgvector"],
  "job_category": "IT/개발",
}


class ResumeParsedDataWriterTests(TestCase):
  """ResumeParsedDataWriter 의 정규화 sub-model 저장 동작 테스트."""

  def setUp(self):
    self.resume = ResumeFactory()

  def test_write_populates_all_sections(self):
    """1:1 / 1:N / N:M / FK 섹션을 모두 정규화 테이블에 기록한다."""
    ResumeParsedDataWriter(resume=self.resume, parsed_data=_FULL_PARSED).write()

    self.resume.refresh_from_db()

    basic = ResumeBasicInfo.objects.get(resume=self.resume)
    self.assertEqual(basic.name, "홍길동")
    self.assertEqual(basic.email, "hong@example.com")

    self.assertEqual(
      ResumeSummary.objects.get(resume=self.resume).text,
      "백엔드 개발자입니다.",
    )

    meta = ResumeCareerMeta.objects.get(resume=self.resume)
    self.assertEqual(meta.total_experience_years, 5)
    self.assertEqual(meta.total_experience_months, 6)

    exp = ResumeExperience.objects.get(resume=self.resume)
    self.assertEqual(exp.company, "ACME")
    self.assertEqual(exp.responsibilities, ["API 설계"])
    self.assertEqual(exp.highlights, ["QPS 3배"])

    self.assertEqual(ResumeEducation.objects.filter(resume=self.resume).count(), 1)
    self.assertEqual(ResumeCertification.objects.filter(resume=self.resume).count(), 1)
    self.assertEqual(ResumeLanguageSpoken.objects.filter(resume=self.resume).count(), 1)

    proj = ResumeProject.objects.get(resume=self.resume)
    self.assertEqual(proj.name, "Nova")
    self.assertEqual(
      {t.name
       for t in proj.tech_stacks.all()},
      {"Go", "Kafka"},
    )
    self.assertEqual(
      ResumeProjectTechStack.objects.filter(resume_project=proj).count(),
      2,
    )

    # N:M
    self.assertEqual(ResumeSkill.objects.filter(resume=self.resume).count(), 5)
    self.assertEqual(ResumeIndustryDomain.objects.filter(resume=self.resume).count(), 2)
    self.assertEqual(ResumeKeyword.objects.filter(resume=self.resume).count(), 2)

    # Skill 은 lowercase 정규화되어 저장됨
    self.assertTrue(Skill.objects.filter(name="python", skill_type=SkillType.TECHNICAL).exists())

    # FK: ResumeJobCategory upsert + 연결
    self.assertIsNotNone(self.resume.resume_job_category_id)
    category = ResumeJobCategory.objects.get(pk=self.resume.resume_job_category_id)
    self.assertEqual(category.name, "IT/개발")

  def test_write_is_idempotent(self):
    """동일 parsed_data 로 두 번 실행해도 섹션별 행 개수가 유지된다."""
    writer = ResumeParsedDataWriter(resume=self.resume, parsed_data=_FULL_PARSED)
    writer.write()
    ResumeParsedDataWriter(resume=self.resume, parsed_data=_FULL_PARSED).write()

    self.assertEqual(ResumeExperience.objects.filter(resume=self.resume).count(), 1)
    self.assertEqual(ResumeSkill.objects.filter(resume=self.resume).count(), 5)
    self.assertEqual(
      ResumeProjectTechStack.objects.filter(resume_project__resume=self.resume).count(),
      2,
    )

  def test_write_handles_empty_parsed_data(self):
    """빈 parsed_data 도 예외 없이 처리하며 1:1 섹션은 빈 값으로 기록된다."""
    ResumeParsedDataWriter(resume=self.resume, parsed_data={}).write()

    self.assertEqual(ResumeBasicInfo.objects.get(resume=self.resume).name, "")
    self.assertEqual(ResumeSummary.objects.get(resume=self.resume).text, "")
    self.assertEqual(ResumeExperience.objects.filter(resume=self.resume).count(), 0)
    self.assertEqual(ResumeSkill.objects.filter(resume=self.resume).count(), 0)
    self.assertIsNone(self.resume.resume_job_category_id)

  def test_write_reuses_canonical_skill_row_across_resumes(self):
    """서로 다른 Resume 이 같은 Skill 을 참조해도 Skill 행은 1개만 존재한다."""
    other_resume = ResumeFactory()
    ResumeParsedDataWriter(resume=self.resume, parsed_data=_FULL_PARSED).write()
    ResumeParsedDataWriter(resume=other_resume, parsed_data=_FULL_PARSED).write()

    # skills.technical 에는 Python/Django 만 있음 → 둘 다 공유
    self.assertEqual(Skill.objects.filter(name="python", skill_type=SkillType.TECHNICAL).count(), 1)
    self.assertEqual(ResumeSkill.objects.filter(skill__name="python").count(), 2)
