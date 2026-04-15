"""이력서 분석 결과(ParsedResumeData) 를 정규화된 sub-model 들에 저장하는 Writer.

책임 분리:
- 이 Writer 는 순수 "parsed_data → ORM sub-row" 매퍼다. 트랜잭션이나 외부 부수효과(status 전환,
  임베딩, 토큰 사용량) 는 `ApplyAnalysisResultService` 가 담당한다.
- idempotent: 동일 Resume 에 대해 다시 호출하면 기존 sub-row 를 전부 삭제하고 다시 생성한다.
- Resume.parsed_data JSONField 는 전환 기간 동안 backup 으로 유지하되, 읽기 경로는 점진적으로
  정규화 테이블로 이관한다.
"""

from __future__ import annotations

from typing import Any

from django.db import transaction
from resumes.enums import SkillType
from resumes.models import (
  IndustryDomain,
  Keyword,
  Resume,
  ResumeAward,
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
  TechStack,
)
from resumes.schemas.parsed_data import ParsedResumeData


class ResumeParsedDataWriter:
  """parsed_data 를 정규화된 Resume sub-model 들에 저장한다."""

  def __init__(self, resume: Resume, parsed_data: dict[str, Any] | ParsedResumeData | None):
    self.resume = resume
    if isinstance(parsed_data, ParsedResumeData):
      self.data = parsed_data
    else:
      self.data = ParsedResumeData.from_raw(parsed_data)

  @transaction.atomic
  def write(self) -> None:
    """전체 parsed 섹션을 순서대로 써넣는다."""
    self._write_basic_info()
    self._write_summary()
    self._write_career_meta()
    self._write_experiences()
    self._write_educations()
    self._write_certifications()
    self._write_awards()
    self._write_projects()
    self._write_languages_spoken()
    self._write_skills()
    self._write_industry_domains()
    self._write_keywords()
    self._write_job_category()

  # ── 1:1 ─────────────────────────────────────────────────────────────────

  def _write_basic_info(self) -> None:
    bi = self.data.basic_info
    ResumeBasicInfo.objects.update_or_create(
      resume=self.resume,
      defaults={
        "name": bi.name or "",
        "email": bi.email or "",
        "phone": bi.phone or "",
        "location": bi.location or "",
      },
    )

  def _write_summary(self) -> None:
    ResumeSummary.objects.update_or_create(
      resume=self.resume,
      defaults={"text": self.data.summary or ""},
    )

  def _write_career_meta(self) -> None:
    ResumeCareerMeta.objects.update_or_create(
      resume=self.resume,
      defaults={
        "total_experience_years": self.data.total_experience_years,
        "total_experience_months": self.data.total_experience_months,
      },
    )

  # ── 1:N (resume 소유, idempotent 를 위해 삭제 후 재삽입) ───────────────────

  def _write_experiences(self) -> None:
    ResumeExperience.objects.filter(resume=self.resume).delete()
    ResumeExperience.objects.bulk_create(
      [
        ResumeExperience(
          resume=self.resume,
          company=e.company or "",
          role=e.role or "",
          period=e.period or "",
          responsibilities=list(e.responsibilities or []),
          highlights=list(e.highlights or []),
          display_order=idx,
        ) for idx, e in enumerate(self.data.experiences)
      ]
    )

  def _write_educations(self) -> None:
    ResumeEducation.objects.filter(resume=self.resume).delete()
    ResumeEducation.objects.bulk_create(
      [
        ResumeEducation(
          resume=self.resume,
          school=e.school or "",
          degree=e.degree or "",
          major=e.major or "",
          period=e.period or "",
          display_order=idx,
        ) for idx, e in enumerate(self.data.educations)
      ]
    )

  def _write_certifications(self) -> None:
    ResumeCertification.objects.filter(resume=self.resume).delete()
    ResumeCertification.objects.bulk_create(
      [
        ResumeCertification(
          resume=self.resume,
          name=c.name or "",
          issuer=c.issuer or "",
          date=c.date or "",
          display_order=idx,
        ) for idx, c in enumerate(self.data.certifications)
      ]
    )

  def _write_awards(self) -> None:
    ResumeAward.objects.filter(resume=self.resume).delete()
    ResumeAward.objects.bulk_create(
      [
        ResumeAward(
          resume=self.resume,
          name=a.name or "",
          year=a.year or "",
          organization=a.organization or "",
          description=a.description or "",
          display_order=idx,
        ) for idx, a in enumerate(self.data.awards)
      ]
    )

  def _write_projects(self) -> None:
    """프로젝트 + 기술 스택 재작성.

    최적화: 프로젝트당 junction rows 를 `bulk_create` 로 한 번에 삽입.
    canonical TechStack 조회는 로컬 캐시(`tech_cache`) 로 같은 이름 재활용.
    """
    ResumeProject.objects.filter(resume=self.resume).delete()
    tech_cache: dict[str, TechStack] = {}
    for idx, p in enumerate(self.data.projects):
      project = ResumeProject.objects.create(
        resume=self.resume,
        name=p.name or "",
        role=p.role or "",
        period=p.period or "",
        description=p.description or "",
        display_order=idx,
      )
      junctions: list[ResumeProjectTechStack] = []
      for tech_idx, tech_name in enumerate(p.tech_stack or []):
        normalized = (tech_name or "").strip()
        if not normalized:
          continue
        tech = tech_cache.get(normalized)
        if tech is None:
          tech = TechStack.get_or_create_normalized(normalized)
          if tech is None:
            continue
          tech_cache[normalized] = tech
        junctions.append(ResumeProjectTechStack(
          resume_project=project,
          tech_stack=tech,
          display_order=tech_idx,
        ))
      if junctions:
        ResumeProjectTechStack.objects.bulk_create(junctions, ignore_conflicts=True)

  def _write_languages_spoken(self) -> None:
    ResumeLanguageSpoken.objects.filter(resume=self.resume).delete()
    ResumeLanguageSpoken.objects.bulk_create(
      [
        ResumeLanguageSpoken(
          resume=self.resume,
          language=l.language or "",
          level=l.level or "",
          display_order=idx,
        ) for idx, l in enumerate(self.data.languages_spoken)
      ]
    )

  # ── N:M (공용 참조 테이블 upsert + 경유 테이블 재구성) ────────────────────────────────

  def _write_skills(self) -> None:
    """스킬 junction 재작성. 모든 그룹을 모아 `bulk_create` 로 한 번에 삽입한다."""
    ResumeSkill.objects.filter(resume=self.resume).delete()
    junctions: list[ResumeSkill] = []
    order = 0
    for group, skill_type in (
      (self.data.skills.technical, SkillType.TECHNICAL),
      (self.data.skills.soft, SkillType.SOFT),
      (self.data.skills.tools, SkillType.TOOL),
      (self.data.skills.languages, SkillType.LANGUAGE),
    ):
      for name in group or []:
        skill = Skill.get_or_create_normalized(name, skill_type)
        if skill is None:
          continue
        junctions.append(ResumeSkill(resume=self.resume, skill=skill, display_order=order))
        order += 1
    if junctions:
      ResumeSkill.objects.bulk_create(junctions, ignore_conflicts=True)

  def _write_industry_domains(self) -> None:
    ResumeIndustryDomain.objects.filter(resume=self.resume).delete()
    for idx, name in enumerate(self.data.industry_domains or []):
      domain = IndustryDomain.get_or_create_normalized(name)
      if domain is None:
        continue
      ResumeIndustryDomain.objects.get_or_create(
        resume=self.resume,
        industry_domain=domain,
        defaults={"display_order": idx},
      )

  def _write_keywords(self) -> None:
    ResumeKeyword.objects.filter(resume=self.resume).delete()
    for idx, text in enumerate(self.data.keywords or []):
      keyword = Keyword.get_or_create_normalized(text)
      if keyword is None:
        continue
      ResumeKeyword.objects.get_or_create(
        resume=self.resume,
        keyword=keyword,
        defaults={"display_order": idx},
      )

  # ── N:1 직군 (기존 ResumeJobCategory FK) ──────────────────────────────────

  def _write_job_category(self) -> None:
    """parsed_data.job_category 텍스트 → ResumeJobCategory upsert + FK 연결."""
    category_name = self.data.job_category
    if not category_name or not category_name.strip():
      return
    category = ResumeJobCategory.get_or_create_from_text(category_name)
    if category is None:
      return
    self.resume.resume_job_category = category
    self.resume.save(update_fields=["resume_job_category", "updated_at"])
