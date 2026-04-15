"""Resume soft-delete cascade + 선택적 restore 검증.

각 sub-model 이 Resume 의 `delete()` 와 동시에 soft-delete 되는지,
그리고 `restore()` 시 `soft_restore_cascade` 에 선언된 대상만 살아나는지 확인한다.

테스트 실행:
    docker-compose exec webapp python manage.py test \\
      resumes.tests.models.test_resume_soft_cascade
"""

from __future__ import annotations

from django.test import TestCase
from django.utils import timezone
from resumes.enums import SkillType
from resumes.factories import (
  IndustryDomainFactory,
  KeywordFactory,
  ResumeAwardFactory,
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
  ResumeAward,
  ResumeBasicInfo,
  ResumeCareerMeta,
  ResumeCertification,
  ResumeEducation,
  ResumeExperience,
  ResumeIndustryDomain,
  ResumeKeyword,
  ResumeLanguageSpoken,
  ResumeProject,
  ResumeProjectTechStack,
  ResumeSkill,
  ResumeSummary,
)


def _build_full_resume():
  """모든 sub-model 이 붙은 Resume 그래프를 만든다."""
  resume = ResumeFactory()

  ResumeBasicInfoFactory(resume=resume, name="홍길동")
  ResumeSummaryFactory(resume=resume, text="요약")
  ResumeCareerMetaFactory(resume=resume, total_experience_years=3, total_experience_months=6)

  ResumeExperienceFactory(resume=resume, company="ACME")
  ResumeExperienceFactory(resume=resume, company="Beta")
  ResumeEducationFactory(resume=resume, school="KMU")
  ResumeCertificationFactory(resume=resume, name="AWS SAA")
  ResumeAwardFactory(resume=resume, name="대상")
  ResumeLanguageSpokenFactory(resume=resume, language="영어", level="비즈니스")

  project = ResumeProjectFactory(resume=resume, name="Nova")
  tech = TechStackFactory(name="python")
  ResumeProjectTechStackFactory(resume_project=project, tech_stack=tech)

  skill = SkillFactory(name="django", skill_type=SkillType.TECHNICAL)
  ResumeSkillFactory(resume=resume, skill=skill)

  domain = IndustryDomainFactory(name="핀테크")
  ResumeIndustryDomainFactory(resume=resume, industry_domain=domain)

  keyword = KeywordFactory(text="microservices")
  ResumeKeywordFactory(resume=resume, keyword=keyword)

  return resume


class ResumeSoftCascadeDeleteTests(TestCase):
  """resume.delete() 호출 시 연관 sub-model 이 모두 soft-delete 되는지."""

  def setUp(self):
    self.resume = _build_full_resume()

  def test_resume_delete_sets_deleted_at_on_resume(self):
    """Resume 자체가 soft-delete 된다."""
    self.resume.delete()
    self.resume.refresh_from_db()
    self.assertIsNotNone(self.resume.deleted_at)

  def test_one_to_one_children_cascade_soft_deleted(self):
    """basic_info / summary / career_meta 가 cascade soft-delete 된다."""
    self.resume.delete()
    for model in (ResumeBasicInfo, ResumeSummary, ResumeCareerMeta):
      with self.subTest(model=model.__name__):
        self.assertEqual(model.objects.filter(resume=self.resume).count(), 0)
        deleted = model.all_objects.filter(resume=self.resume)
        self.assertEqual(deleted.count(), 1)
        self.assertTrue(all(o.deleted_at is not None for o in deleted))

  def test_one_to_many_children_cascade_soft_deleted(self):
    """1:N 자식 테이블이 모두 cascade soft-delete 된다."""
    self.resume.delete()
    expected = {
      ResumeExperience: 2,
      ResumeEducation: 1,
      ResumeCertification: 1,
      ResumeAward: 1,
      ResumeLanguageSpoken: 1,
      ResumeProject: 1,
    }
    for model, count in expected.items():
      with self.subTest(model=model.__name__):
        self.assertEqual(model.objects.filter(resume=self.resume).count(), 0)
        deleted = model.all_objects.filter(resume=self.resume)
        self.assertEqual(deleted.count(), count)
        self.assertTrue(all(o.deleted_at is not None for o in deleted))

  def test_junction_tables_cascade_soft_deleted(self):
    """N:M 경유 테이블이 모두 cascade soft-delete 된다."""
    self.resume.delete()
    for model in (ResumeSkill, ResumeIndustryDomain, ResumeKeyword):
      with self.subTest(model=model.__name__):
        self.assertEqual(model.objects.filter(resume=self.resume).count(), 0)
        deleted = model.all_objects.filter(resume=self.resume)
        self.assertEqual(deleted.count(), 1)
        self.assertTrue(all(o.deleted_at is not None for o in deleted))

  def test_nested_project_tech_stack_cascade_soft_deleted(self):
    """ResumeProject cascade 로 ResumeProjectTechStack 까지 soft-delete 된다."""
    self.resume.delete()
    pts_all = ResumeProjectTechStack.all_objects.filter(resume_project__resume=self.resume)
    self.assertEqual(pts_all.count(), 1)
    self.assertTrue(all(o.deleted_at is not None for o in pts_all))
    # objects 매니저로는 안 보여야 한다
    self.assertEqual(
      ResumeProjectTechStack.objects.filter(resume_project__resume=self.resume).count(),
      0,
    )

  def test_canonical_lookup_tables_are_not_deleted(self):
    """공용 Skill/Keyword/IndustryDomain/TechStack 은 cascade 대상이 아니어야 한다."""
    self.resume.delete()
    from resumes.models import IndustryDomain, Keyword, Skill, TechStack
    self.assertTrue(Skill.objects.exists())
    self.assertTrue(Keyword.objects.exists())
    self.assertTrue(IndustryDomain.objects.exists())
    self.assertTrue(TechStack.objects.exists())

  def test_all_cascaded_children_share_deleted_at_timestamp(self):
    """모든 cascade 자식은 부모와 동일한 deleted_at timestamp 을 가진다."""
    self.resume.delete()
    self.resume.refresh_from_db()
    ts = self.resume.deleted_at
    self.assertIsNotNone(ts)
    for model in (
      ResumeBasicInfo,
      ResumeSummary,
      ResumeCareerMeta,
      ResumeExperience,
      ResumeEducation,
      ResumeCertification,
      ResumeAward,
      ResumeLanguageSpoken,
      ResumeProject,
      ResumeSkill,
      ResumeIndustryDomain,
      ResumeKeyword,
    ):
      with self.subTest(model=model.__name__):
        rows = model.all_objects.filter(resume=self.resume)
        self.assertTrue(rows.exists())
        self.assertTrue(all(o.deleted_at == ts for o in rows))


class ResumeSoftCascadeQuerySetDeleteTests(TestCase):
  """QuerySet.delete() 경로도 동일하게 cascade 되는지."""

  def test_queryset_delete_cascades(self):
    resume = _build_full_resume()
    from resumes.models import Resume
    Resume.objects.filter(pk=resume.pk).delete()

    # 부모 + 모든 자식이 함께 soft-delete 돼야 한다
    resume.refresh_from_db()
    self.assertIsNotNone(resume.deleted_at)
    self.assertEqual(
      ResumeExperience.all_objects.filter(resume=resume, deleted_at__isnull=False).count(),
      2,
    )
    self.assertEqual(
      ResumeKeyword.all_objects.filter(resume=resume, deleted_at__isnull=False).count(),
      1,
    )


class ResumeRestoreCascadeTests(TestCase):
  """restore() 가 `soft_restore_cascade` 목록에 있는 자식만 되살리는지."""

  def setUp(self):
    self.resume = _build_full_resume()

  def test_restore_brings_back_declared_cascade_children(self):
    """선언된 자식은 모두 복구된다."""
    self.resume.delete()
    self.resume.restore()
    self.resume.refresh_from_db()
    self.assertIsNone(self.resume.deleted_at)
    for model in (
      ResumeBasicInfo,
      ResumeSummary,
      ResumeCareerMeta,
      ResumeExperience,
      ResumeEducation,
      ResumeCertification,
      ResumeAward,
      ResumeLanguageSpoken,
      ResumeProject,
      ResumeSkill,
      ResumeIndustryDomain,
      ResumeKeyword,
    ):
      with self.subTest(model=model.__name__):
        self.assertTrue(
          model.objects.filter(resume=self.resume).exists(),
          f"{model.__name__} 가 복구되지 않았다",
        )

  def test_restore_recursively_revives_nested_project_tech_stack(self):
    """ResumeProject.soft_restore_cascade 설정으로 M2M through 도 함께 복구된다."""
    self.resume.delete()
    self.resume.restore()
    self.assertEqual(
      ResumeProjectTechStack.objects.filter(resume_project__resume=self.resume).count(),
      1,
    )

  def test_restore_does_not_revive_children_deleted_before_parent(self):
    """부모 삭제 전에 따로 지워진 자식은 복구 대상이 아니다."""
    # 먼저 한 경력을 따로 soft-delete (시간 차이를 만들기 위해 now 고정)
    pre_exp = ResumeExperience.objects.filter(resume=self.resume).first()
    pre_exp.deleted_at = timezone.now()
    pre_exp.save(update_fields=["deleted_at", "updated_at"])

    # 그 후 resume 을 delete (새 timestamp)
    self.resume.delete()
    self.resume.restore()

    # 사전에 지운 경력은 여전히 deleted 상태
    pre_exp.refresh_from_db()
    self.assertIsNotNone(pre_exp.deleted_at)
    # 같이 지워진 나머지 경력은 복구됨
    alive = ResumeExperience.objects.filter(resume=self.resume)
    self.assertEqual(alive.count(), 1)

  def test_restore_on_alive_resume_is_noop(self):
    """삭제되지 않은 Resume 에 restore() 호출해도 부작용이 없다."""
    self.resume.restore()
    self.resume.refresh_from_db()
    self.assertIsNone(self.resume.deleted_at)
