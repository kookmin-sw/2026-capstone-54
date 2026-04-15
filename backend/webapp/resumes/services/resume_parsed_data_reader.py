"""정규화된 Resume sub-model 들을 읽어 ParsedResumeData 와 동일한 dict 로 재조립한다.

serializer 의 parsed_data 응답이 "정규화 테이블" 을 soft-source 로 삼도록 한다.
Writer 는 JSONField 에도 동일 값을 저장하므로, 정규화가 아직 백필되지 않은 과거 데이터는
JSONField fallback 경로를 이용한다.

N+1 주의:
- 이 reader 는 resume 당 1:1 (basic_info / summary / career_meta) 과
  여러 1:N / N:M 관계에 접근한다. 호출 측(`ResumeViewSet.retrieve` 등) 에서 이들을
  `select_related` / `prefetch_related` 로 미리 로드하면 reader 는 추가 쿼리를 발생시키지 않는다.
- `_has_any_normalized_rows` 같은 exists 게이트는 매 호출마다 12개의 exists 쿼리를 발생시켜
  오히려 비용을 키우므로 제거했다. 대신 완성된 dict 의 비어있음을 확인해 fallback 한다.
"""

from __future__ import annotations

from resumes.enums import SkillType
from resumes.models import Resume
from resumes.schemas.parsed_data import ParsedResumeData


def _safe_one_to_one(resume: Resume, attr: str):
  """reverse 1:1 접근. prefetch/select_related 되어 있으면 추가 쿼리 없이 리턴.

  존재하지 않으면 None 반환. RelatedObjectDoesNotExist 는 AttributeError 의 하위 타입이라
  try/except 로 잡을 수 있다.
  """
  try:
    return getattr(resume, attr)
  except AttributeError:
    return None


class ResumeParsedDataReader:
  """Resume 에서 정규화 sub-model 들을 읽어 dict 형태로 조립한다."""

  def __init__(self, resume: Resume):
    self.resume = resume

  def build_dict(self) -> dict:
    """정규화 테이블에서 읽은 parsed_data dict. 정규화 레코드가 전혀 없으면 빈 dict."""
    data = self._build_parsed().model_dump()
    return data if self._is_nonempty(data) else {}

  def build_or_fallback(self) -> dict | None:
    """정규화 테이블 우선 → 없으면 Resume.parsed_data JSONField fallback.

    serializer 의 parsed_data 필드 source 로 사용한다.
    """
    data = self._build_parsed().model_dump()
    if self._is_nonempty(data):
      return data
    # 전환 기간: 정규화 백필 안 된 구 데이터는 JSONField 를 그대로 반환
    return self.resume.parsed_data

  def _is_nonempty(self, data: dict) -> bool:
    """조립된 dict 에 의미 있는 데이터가 하나라도 있는지 검사."""
    if data.get("summary"):
      return True
    if data.get("total_experience_years") is not None:
      return True
    if data.get("job_category"):
      return True
    for key in (
      "experiences",
      "educations",
      "certifications",
      "awards",
      "projects",
      "languages_spoken",
      "industry_domains",
      "keywords",
    ):
      if data.get(key):
        return True
    basic_info = data.get("basic_info") or {}
    if any(basic_info.get(k) for k in ("name", "email", "phone", "location")):
      return True
    skills = data.get("skills") or {}
    if any(skills.get(k) for k in ("technical", "soft", "tools", "languages")):
      return True
    return False

  def _build_parsed(self) -> ParsedResumeData:
    resume = self.resume

    basic = _safe_one_to_one(resume, "basic_info")
    summary = _safe_one_to_one(resume, "summary")
    meta = _safe_one_to_one(resume, "career_meta")

    # 1:N / N:M : prefetch 된 경우 `.all()` 은 캐시를 재사용한다. 반대로 `.order_by` 를
    # 걸면 Django 가 새 쿼리를 만들어 prefetch 캐시를 무효화한다. 따라서 호출 측에서
    # Prefetch(queryset=X.order_by(...)) 로 정렬을 걸어두고, 여기서는 .all() 만 쓴다.
    experiences = [
      {
        "company": e.company,
        "role": e.role,
        "period": e.period,
        "responsibilities": list(e.responsibilities or []),
        "highlights": list(e.highlights or []),
      } for e in resume.experiences.all()
    ]

    educations = [
      {
        "school": e.school,
        "degree": e.degree,
        "major": e.major,
        "period": e.period,
      } for e in resume.educations.all()
    ]

    certifications = [{"name": c.name, "issuer": c.issuer, "date": c.date} for c in resume.certifications.all()]

    awards = [
      {
        "name": a.name,
        "year": a.year,
        "organization": a.organization,
        "description": a.description,
      } for a in resume.awards.all()
    ]

    projects = [
      {
        "name": p.name,
        "role": p.role,
        "period": p.period,
        "description": p.description,
        "tech_stack": [t.tech_stack.name for t in p.resume_project_tech_stacks.all()],
      } for p in resume.projects.all()
    ]

    languages_spoken = [{"language": lang.language, "level": lang.level} for lang in resume.languages_spoken.all()]

    # 스킬 그룹 재구성
    type_to_key = {
      SkillType.TECHNICAL: "technical",
      SkillType.SOFT: "soft",
      SkillType.TOOL: "tools",
      SkillType.LANGUAGE: "languages",
    }
    skill_groups: dict[str, list[str]] = {
      "technical": [],
      "soft": [],
      "tools": [],
      "languages": [],
    }
    for rs in resume.resume_skills.all():
      key = type_to_key.get(rs.skill.skill_type)
      if key:
        skill_groups[key].append(rs.skill.name)

    industry_domains = [rid.industry_domain.name for rid in resume.resume_industry_domains.all()]

    keywords = [rk.keyword.text for rk in resume.resume_keywords.all()]

    return ParsedResumeData(
      basic_info={
        "name": basic.name if basic else None,
        "email": basic.email if basic else None,
        "phone": basic.phone if basic else None,
        "location": basic.location if basic else None,
      },
      summary=summary.text if summary else "",
      skills=skill_groups,  # type: ignore[arg-type]
      experiences=experiences,  # type: ignore[arg-type]
      educations=educations,  # type: ignore[arg-type]
      certifications=certifications,  # type: ignore[arg-type]
      awards=awards,  # type: ignore[arg-type]
      projects=projects,  # type: ignore[arg-type]
      languages_spoken=languages_spoken,  # type: ignore[arg-type]
      total_experience_years=(
        int(meta.total_experience_years) if meta and meta.total_experience_years is not None else None
      ),
      total_experience_months=(
        int(meta.total_experience_months) if meta and meta.total_experience_months is not None else None
      ),
      industry_domains=industry_domains,
      keywords=keywords,
      job_category=(resume.resume_job_category.name if resume.resume_job_category_id else None),
    )
