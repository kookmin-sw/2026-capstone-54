"""Resume Unfold 어드민.

분석으로 채워진 정규화 sub-model 들을 상세 fieldset 에서 요약 + 링크로 보여준다.
N+1 방지를 위해 list/detail 별로 select_related / prefetch_related 를 걸어둔다.
"""

from django.contrib import admin
from django.db.models import Prefetch
from django.urls import reverse
from django.utils.html import format_html, format_html_join
from django.utils.safestring import mark_safe
from resumes.models import (
  Resume,
  ResumeIndustryDomain,
  ResumeKeyword,
  ResumeProject,
  ResumeProjectTechStack,
  ResumeSkill,
)
from unfold.admin import ModelAdmin

# ── 공통 헬퍼 ──────────────────────────────────────────────────────────────


def _admin_change_url(app_label: str, model_name: str, pk) -> str:
  return reverse(f"admin:{app_label}_{model_name}_change", args=[pk])


def _link(label: str, url: str) -> str:
  return format_html(
    '<a href="{}" style="color:#0991B2;text-decoration:underline;">{}</a>',
    url,
    label,
  )


def _section_html(title: str, rows_html: str) -> str:
  if not rows_html:
    rows_html = mark_safe('<div style="color:#9CA3AF;font-style:italic;">(데이터 없음)</div>')
  return format_html(
    '<div style="margin-bottom:12px;">'
    '<div style="font-weight:bold;color:#0A0A0A;margin-bottom:4px;">{}</div>'
    '{}</div>',
    title,
    rows_html,
  )


def _detail_link(model_name: str, pk) -> str:
  """sub-model 상세 링크 (resumes 앱 고정)."""
  return _link("상세로 →", _admin_change_url("resumes", model_name, pk))


def _render_list_section(title, items, template, row_extractor, *, separator="", wrap_ul=True):
  """1:N / N:M 리스트 섹션을 렌더하는 공통 헬퍼.

  Args:
    title: 섹션 제목
    items: iterable (이미 평가된 리스트)
    template: format_html_join 에 넘길 HTML 템플릿
    row_extractor: 각 item → tuple 을 반환하는 callable
    separator: format_html_join 구분자
    wrap_ul: True 면 <ul> 로 감싸고, False 면 <div> 로 감싼다
  """
  if not items:
    return _section_html(title, "")
  rows = format_html_join(separator, template, (row_extractor(item) for item in items))
  tag = "ul style='margin:0;padding-left:18px;'" if wrap_ul else "div"
  close_tag = "ul" if wrap_ul else "div"
  return _section_html(title, format_html(f"<{tag}>{{}}</{close_tag}>", rows))


@admin.register(Resume)
class ResumeAdmin(ModelAdmin):
  """이력서 어드민. 목록 + 상세에서 정규화 sub-model 들을 요약 제공."""

  list_display = (
    "uuid",
    "user_link",
    "type",
    "title",
    "analysis_status",
    "analysis_step",
    "job_category_link",
    "created_at",
  )
  list_filter = (
    "type",
    "analysis_status",
    "analysis_step",
    "resume_job_category",
  )
  list_select_related = ("user", "resume_job_category")
  search_fields = ("title", "user__email", "uuid")
  ordering = ("-created_at", )
  autocomplete_fields = ("user", "resume_job_category")

  readonly_fields = (
    "uuid",
    "analyzed_at",
    "created_at",
    "updated_at",
    "deleted_at",
    # 정규화 sub-model 요약 필드
    "basic_info_display",
    "summary_display",
    "career_meta_display",
    "skills_display",
    "experiences_display",
    "educations_display",
    "certifications_display",
    "awards_display",
    "projects_display",
    "languages_spoken_display",
    "industry_domains_display",
    "keywords_display",
  )

  fieldsets = (
    (None, {
      "fields": ("uuid", "user", "type", "title"),
    }),
    ("분석 상태", {
      "fields": (
        "analysis_status",
        "analysis_step",
        "is_parsed",
        "analyzed_at",
        "resume_job_category",
      ),
    }),
    (
      "분석 결과 (정규화 sub-model)", {
        "fields": (
          "basic_info_display",
          "summary_display",
          "career_meta_display",
          "skills_display",
          "experiences_display",
          "educations_display",
          "certifications_display",
          "awards_display",
          "projects_display",
          "languages_spoken_display",
          "industry_domains_display",
          "keywords_display",
        ),
      }
    ),
    ("원본 parsed_data JSON (backward compat)", {
      "fields": ("parsed_data", ),
      "classes": ("collapse", ),
    }),
    ("날짜", {
      "fields": ("created_at", "updated_at", "deleted_at"),
    }),
  )

  # ── N+1 방지 ───────────────────────────────────────────────────────────

  def get_queryset(self, request):
    """list: FK 만, detail: 1:1/1:N/N:M 모두 preload."""
    qs = super().get_queryset(request).select_related("user", "resume_job_category")

    # changelist 는 list_select_related 로 충분, 상세 페이지에서만 heavy preload
    if request.resolver_match and request.resolver_match.url_name and request.resolver_match.url_name.endswith(
      "_change"
    ):
      qs = qs.select_related(
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
              queryset=ResumeProjectTechStack.objects.select_related("tech_stack"
                                                                     ).order_by("display_order", "created_at"),
            ),
          ).order_by("display_order", "created_at"),
        ),
        Prefetch(
          "resume_skills",
          queryset=ResumeSkill.objects.select_related("skill").order_by("display_order", "created_at"),
        ),
        Prefetch(
          "resume_industry_domains",
          queryset=ResumeIndustryDomain.objects.select_related("industry_domain"
                                                               ).order_by("display_order", "created_at"),
        ),
        Prefetch(
          "resume_keywords",
          queryset=ResumeKeyword.objects.select_related("keyword").order_by("display_order", "created_at"),
        ),
      )
    return qs

  # ── 목록 행 내 링크 ────────────────────────────────────────────────────

  @admin.display(description="사용자", ordering="user__email")
  def user_link(self, obj: Resume):
    """사용자 어드민 링크."""
    if obj.user_id is None:
      return "-"
    try:
      url = _admin_change_url("users", "user", obj.user_id)
    except Exception:
      return obj.user.email
    return _link(obj.user.email, url)

  @admin.display(description="직군", ordering="resume_job_category__name")
  def job_category_link(self, obj: Resume):
    """직군 어드민 링크."""
    if obj.resume_job_category_id is None:
      return "-"
    category = obj.resume_job_category
    label = f"{category.emoji} {category.name}" if category.emoji else category.name
    url = _admin_change_url("resumes", "resumejobcategory", obj.resume_job_category_id)
    return _link(label, url)

  # ── 상세 fieldset — 1:1 sub-model ─────────────────────────────────────

  @admin.display(description="기본 정보")
  def basic_info_display(self, obj: Resume):
    """기본 정보 섹션."""
    basic = getattr(obj, "basic_info", None)
    if not basic:
      return _section_html("기본 정보", "")
    body = format_html(
      '<div>이름: {}<br>이메일: {}<br>전화: {}<br>지역: {}<br>{}</div>',
      basic.name or "-",
      basic.email or "-",
      basic.phone or "-",
      basic.location or "-",
      _detail_link("resumebasicinfo", basic.pk),
    )
    return _section_html("기본 정보", body)

  @admin.display(description="요약")
  def summary_display(self, obj: Resume):
    """요약 섹션."""
    summary = getattr(obj, "summary", None)
    if not summary:
      return _section_html("요약", "")
    body = format_html(
      '<div style="white-space:pre-wrap;">{}</div><div>{}</div>',
      summary.text or "-",
      _detail_link("resumesummary", summary.pk),
    )
    return _section_html("요약", body)

  @admin.display(description="경력 메타")
  def career_meta_display(self, obj: Resume):
    """경력 메타 섹션."""
    meta = getattr(obj, "career_meta", None)
    if not meta:
      return _section_html("경력 메타", "")
    if meta.total_experience_years is not None or meta.total_experience_months is not None:
      label = f"{meta.total_experience_years or 0}년 {meta.total_experience_months or 0}개월"
    else:
      label = "-"
    body = format_html(
      '<div>총 경력: {}<br>{}</div>',
      label,
      _detail_link("resumecareermeta", meta.pk),
    )
    return _section_html("경력 메타", body)

  # ── 상세 fieldset — 1:N / N:M 리스트 sub-model ────────────────────────

  @admin.display(description="스킬 (N:M)")
  def skills_display(self, obj: Resume):
    """스킬 섹션."""
    return _render_list_section(
      "스킬",
      list(obj.resume_skills.all()),
      '<li>{} / {} — {}</li>',
      lambda rs: (rs.skill.skill_type, rs.skill.name, _detail_link("resumeskill", rs.pk)),
    )

  @admin.display(description="경력")
  def experiences_display(self, obj: Resume):
    """경력 섹션."""
    return _render_list_section(
      "경력",
      list(obj.experiences.all()),
      '<li><strong>{}</strong> / {} ({}) — {}</li>',
      lambda e: (e.company or "-", e.role or "-", e.period or "-", _detail_link("resumeexperience", e.pk)),
    )

  @admin.display(description="학력")
  def educations_display(self, obj: Resume):
    """학력 섹션."""
    return _render_list_section(
      "학력",
      list(obj.educations.all()),
      '<li><strong>{}</strong> — {} / {} ({}) — {}</li>',
      lambda e:
      (e.school or "-", e.major or "-", e.degree or "-", e.period or "-", _detail_link("resumeeducation", e.pk)),
    )

  @admin.display(description="자격증")
  def certifications_display(self, obj: Resume):
    """자격증 섹션."""
    return _render_list_section(
      "자격증",
      list(obj.certifications.all()),
      '<li><strong>{}</strong> — {} ({}) — {}</li>',
      lambda c: (c.name or "-", c.issuer or "-", c.date or "-", _detail_link("resumecertification", c.pk)),
    )

  @admin.display(description="수상 이력")
  def awards_display(self, obj: Resume):
    """수상 이력 섹션."""
    return _render_list_section(
      "수상 이력",
      list(obj.awards.all()),
      '<li><strong>{}</strong> — {} ({}) — {}</li>',
      lambda a: (a.name or "-", a.organization or "-", a.year or "-", _detail_link("resumeaward", a.pk)),
    )

  @admin.display(description="프로젝트")
  def projects_display(self, obj: Resume):
    """프로젝트 섹션."""
    return _render_list_section(
      "프로젝트",
      list(obj.projects.all()),
      '<li><strong>{}</strong> / {} ({}) — tech: {} — {}</li>',
      lambda p: (
        p.name or "-",
        p.role or "-",
        p.period or "-",
        ", ".join(t.tech_stack.name for t in p.resume_project_tech_stacks.all()) or "-",
        _detail_link("resumeproject", p.pk),
      ),
    )

  @admin.display(description="구사 언어")
  def languages_spoken_display(self, obj: Resume):
    """구사 언어 섹션."""
    return _render_list_section(
      "구사 언어",
      list(obj.languages_spoken.all()),
      '<li>{} — {} ({})</li>',
      lambda item: (item.language or "-", item.level or "-", _detail_link("resumelanguagespoken", item.pk)),
    )

  @admin.display(description="산업 도메인 (N:M)")
  def industry_domains_display(self, obj: Resume):
    """산업 도메인 섹션."""
    return _render_list_section(
      "산업 도메인",
      list(obj.resume_industry_domains.all()),
      "{}",
      lambda rid:
      (_link(rid.industry_domain.name, _admin_change_url("resumes", "industrydomain", rid.industry_domain_id)), ),
      separator=", ",
      wrap_ul=False,
    )

  @admin.display(description="키워드 (N:M)")
  def keywords_display(self, obj: Resume):
    """키워드 섹션."""
    return _render_list_section(
      "키워드",
      list(obj.resume_keywords.all()),
      "{}",
      lambda rk: (_link(rk.keyword.text, _admin_change_url("resumes", "keyword", rk.keyword_id)), ),
      separator=", ",
      wrap_ul=False,
    )
