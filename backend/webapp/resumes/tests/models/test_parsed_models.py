"""신규 parsed 관련 모델(1:1 / 1:N / N:M) 통합 스모크 테스트.

모델이 올바르게 선언되고 마이그레이션이 반영되어 Django ORM 으로 생성 / 조회가 되는지 검증한다.
세부 비즈니스 로직(정규화, writer 서비스 등) 은 별도 테스트 파일에서 다룬다.
"""

from django.test import TestCase
from resumes.enums import SkillType
from resumes.factories import (
  IndustryDomainFactory,
  KeywordFactory,
  ResumeBasicInfoFactory,
  ResumeCareerMetaFactory,
  ResumeCertificationFactory,
  ResumeEducationFactory,
  ResumeExperienceFactory,
  ResumeFactory,
  ResumeIndustryDomainFactory,
  ResumeKeywordFactory,
  ResumeLanguageSpokenFactory,
  ResumeProjectFactory,
  ResumeProjectTechStackFactory,
  ResumeSkillFactory,
  ResumeSummaryFactory,
  SkillFactory,
  TechStackFactory,
)
from resumes.models import (
  IndustryDomain,
  Keyword,
  Skill,
  TechStack,
)


class ParsedModelsSmokeTests(TestCase):
  """신규 parsed 모델 전체 스모크 테스트."""

  def test_resume_can_have_full_parsed_subgraph(self):
    """하나의 Resume 가 1:1, 1:N, N:M 관계를 모두 가진 완전한 그래프를 구성할 수 있다."""
    resume = ResumeFactory()

    # 1:1
    ResumeBasicInfoFactory(resume=resume, name="홍길동", email="hong@example.com")
    ResumeSummaryFactory(resume=resume, text="백엔드 개발자입니다.")
    ResumeCareerMetaFactory(resume=resume, total_experience_years=5, total_experience_months=6)

    # 1:N
    ResumeExperienceFactory(
      resume=resume,
      company="ACME",
      responsibilities=["API 설계"],
      highlights=["QPS 3 배 개선"],
    )
    ResumeEducationFactory(resume=resume, school="KMU")
    ResumeCertificationFactory(resume=resume, name="AWS SAA")
    project = ResumeProjectFactory(resume=resume, name="Nova")
    ResumeLanguageSpokenFactory(resume=resume, language="English", level="Business")

    # N:M (공용 참조 테이블 + 경유 테이블)
    skill_python = SkillFactory(name="python", skill_type=SkillType.TECHNICAL)
    ResumeSkillFactory(resume=resume, skill=skill_python)
    ResumeIndustryDomainFactory(resume=resume, industry_domain=IndustryDomainFactory(name="핀테크"))
    ResumeKeywordFactory(resume=resume, keyword=KeywordFactory(text="microservices"))
    ResumeProjectTechStackFactory(resume_project=project, tech_stack=TechStackFactory(name="Go"))

    # Assertions — 역참조로 접근되는지 확인
    resume.refresh_from_db()
    self.assertEqual(resume.basic_info.name, "홍길동")
    self.assertEqual(resume.summary.text, "백엔드 개발자입니다.")
    self.assertEqual(resume.career_meta.total_experience_years, 5)
    self.assertEqual(resume.career_meta.total_experience_months, 6)
    self.assertEqual(resume.experiences.count(), 1)
    self.assertEqual(resume.experiences.first().responsibilities, ["API 설계"])
    self.assertEqual(resume.educations.count(), 1)
    self.assertEqual(resume.certifications.count(), 1)
    self.assertEqual(resume.projects.count(), 1)
    self.assertEqual(resume.languages_spoken.count(), 1)
    self.assertEqual(resume.resume_skills.count(), 1)
    self.assertEqual(resume.resume_industry_domains.count(), 1)
    self.assertEqual(resume.resume_keywords.count(), 1)
    self.assertEqual(project.tech_stacks.count(), 1)

  def test_skill_get_or_create_normalized_lowercases_and_strips(self):
    """Skill.get_or_create_normalized 는 이름을 lowercase + strip 한 뒤 dedup 한다."""
    a = Skill.get_or_create_normalized("  Python  ", SkillType.TECHNICAL)
    b = Skill.get_or_create_normalized("python", SkillType.TECHNICAL)
    self.assertIsNotNone(a)
    self.assertEqual(a.pk, b.pk)
    self.assertEqual(a.name, "python")
    self.assertEqual(Skill.objects.count(), 1)

  def test_skill_same_name_different_type_coexist(self):
    """같은 이름이라도 skill_type 이 다르면 별도 행으로 존재한다."""
    Skill.get_or_create_normalized("english", SkillType.LANGUAGE)
    Skill.get_or_create_normalized("english", SkillType.SOFT)
    self.assertEqual(Skill.objects.count(), 2)

  def test_shared_tag_helpers_return_none_for_empty_input(self):
    """공용 참조 테이블(Skill/IndustryDomain/Keyword/TechStack) 헬퍼는 빈 입력에 대해 None 을 반환한다."""
    self.assertIsNone(Skill.get_or_create_normalized("  ", SkillType.TECHNICAL))
    self.assertIsNone(IndustryDomain.get_or_create_normalized(""))
    self.assertIsNone(Keyword.get_or_create_normalized(None))  # type: ignore[arg-type]
    self.assertIsNone(TechStack.get_or_create_normalized("   "))
