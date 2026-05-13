"""Resume 상세 직렬화/번들 빌드에 필요한 전체 관계 prefetch 헬퍼.

`ResumeParsedDataReader` / `ResumeParsedDataBundleService` 가 touch 하는
1:1 / 1:N / N:M 관계를 한 번에 로드해 N+1 을 막는다. 모든 호출 측은
`reload_resume_with_full_prefetch(resume)` 또는 `resume_full_queryset()` 만 사용한다.
"""

from __future__ import annotations

from django.db.models import Prefetch
from resumes.models import (
  Resume,
  ResumeIndustryDomain,
  ResumeKeyword,
  ResumeProject,
  ResumeProjectTechStack,
  ResumeSkill,
)


def resume_full_queryset():
  """detail/bundle 직렬화에 필요한 모든 관계가 prefetch 된 Resume 쿼리셋."""
  return Resume.objects.select_related(
    "resume_job_category",
    "text_content",
    "file_content",
    "basic_info",
    "summary",
    "career_meta",
  ).prefetch_related(
    "experiences",
    "educations",
    "certifications",
    "awards",
    "languages_spoken",
    Prefetch(
      "projects",
      queryset=ResumeProject.objects.prefetch_related(
        Prefetch(
          "resume_project_tech_stacks",
          queryset=ResumeProjectTechStack.objects.select_related("tech_stack").order_by("display_order", "created_at"),
        ),
      ).order_by("display_order", "created_at"),
    ),
    Prefetch(
      "resume_skills",
      queryset=ResumeSkill.objects.select_related("skill").order_by("display_order", "created_at"),
    ),
    Prefetch(
      "resume_industry_domains",
      queryset=ResumeIndustryDomain.objects.select_related("industry_domain").order_by("display_order", "created_at"),
    ),
    Prefetch(
      "resume_keywords",
      queryset=ResumeKeyword.objects.select_related("keyword").order_by("display_order", "created_at"),
    ),
  )


def reload_resume_with_full_prefetch(resume: Resume) -> Resume:
  """주어진 resume 인스턴스를 full prefetch 쿼리셋으로 다시 가져온다."""
  return resume_full_queryset().get(pk=resume.pk)
