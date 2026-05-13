from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
  ResumeAwardSectionViewSet,
  ResumeBasicInfoSectionViewSet,
  ResumeCareerMetaSectionViewSet,
  ResumeCertificationSectionViewSet,
  ResumeCountStatsView,
  ResumeEducationSectionViewSet,
  ResumeExperienceSectionViewSet,
  ResumeIndustryDomainsSectionViewSet,
  ResumeJobCategorySectionViewSet,
  ResumeKeywordsSectionViewSet,
  ResumeLanguageSpokenSectionViewSet,
  ResumeProjectSectionViewSet,
  ResumeRecentActivityStatsView,
  ResumeSkillsSectionViewSet,
  ResumeSummarySectionViewSet,
  ResumeTextContentTemplateDetailView,
  ResumeTextContentTemplateListView,
  ResumeTopSkillsStatsView,
  ResumeTypeStatsView,
  ResumeViewSet,
)

router = DefaultRouter()
router.register(r"", ResumeViewSet, basename="resume")


def _item_section(viewset_cls):
  """1:N ViewSet → (collection_view, item_view) 튜플."""
  collection = viewset_cls.as_view({"get": "list", "post": "create"})
  item = viewset_cls.as_view({"put": "update", "delete": "destroy"})
  return collection, item


def _singleton_section(viewset_cls):
  """1:1 ViewSet → collection URL PUT → upsert."""
  return viewset_cls.as_view({"put": "upsert"})


def _replace_section(viewset_cls):
  """N:M ViewSet → collection URL PUT → replace."""
  return viewset_cls.as_view({"put": "replace"})


# 1:N: (collection, item) 뷰 쌍
exp_list, exp_item = _item_section(ResumeExperienceSectionViewSet)
edu_list, edu_item = _item_section(ResumeEducationSectionViewSet)
cert_list, cert_item = _item_section(ResumeCertificationSectionViewSet)
award_list, award_item = _item_section(ResumeAwardSectionViewSet)
proj_list, proj_item = _item_section(ResumeProjectSectionViewSet)
lang_list, lang_item = _item_section(ResumeLanguageSpokenSectionViewSet)

# 섹션 CRUD URL 그룹 — `/api/v1/resumes/<uuid>/sections/...`
section_urlpatterns = [
  # 1:1 / FK singleton
  path("basic-info/", _singleton_section(ResumeBasicInfoSectionViewSet), name="resume-section-basic-info"),
  path("summary/", _singleton_section(ResumeSummarySectionViewSet), name="resume-section-summary"),
  path("career-meta/", _singleton_section(ResumeCareerMetaSectionViewSet), name="resume-section-career-meta"),
  path("job-category/", _singleton_section(ResumeJobCategorySectionViewSet), name="resume-section-job-category"),
  # 1:N list/create + item update/delete
  path("experiences/", exp_list, name="resume-section-experiences"),
  path("experiences/<str:uuid>/", exp_item, name="resume-section-experience-item"),
  path("educations/", edu_list, name="resume-section-educations"),
  path("educations/<str:uuid>/", edu_item, name="resume-section-education-item"),
  path("certifications/", cert_list, name="resume-section-certifications"),
  path("certifications/<str:uuid>/", cert_item, name="resume-section-certification-item"),
  path("awards/", award_list, name="resume-section-awards"),
  path("awards/<str:uuid>/", award_item, name="resume-section-award-item"),
  path("projects/", proj_list, name="resume-section-projects"),
  path("projects/<str:uuid>/", proj_item, name="resume-section-project-item"),
  path("languages-spoken/", lang_list, name="resume-section-languages-spoken"),
  path("languages-spoken/<str:uuid>/", lang_item, name="resume-section-language-spoken-item"),
  # N:M replace-all
  path("skills/", _replace_section(ResumeSkillsSectionViewSet), name="resume-section-skills"),
  path(
    "industry-domains/",
    _replace_section(ResumeIndustryDomainsSectionViewSet),
    name="resume-section-industry-domains",
  ),
  path("keywords/", _replace_section(ResumeKeywordsSectionViewSet), name="resume-section-keywords"),
]

urlpatterns = [
  # 통계 (분류별 분리)
  path("stats/count/", ResumeCountStatsView.as_view(), name="resume-stats-count"),
  path("stats/type/", ResumeTypeStatsView.as_view(), name="resume-stats-type"),
  path("stats/top-skills/", ResumeTopSkillsStatsView.as_view(), name="resume-stats-top-skills"),
  path(
    "stats/recent-activity/",
    ResumeRecentActivityStatsView.as_view(),
    name="resume-stats-recent-activity",
  ),
  # 템플릿
  path("templates/", ResumeTextContentTemplateListView.as_view(), name="resume-templates-list"),
  path(
    "templates/<str:uuid>/",
    ResumeTextContentTemplateDetailView.as_view(),
    name="resume-templates-detail",
  ),
  # 섹션 CRUD — router 보다 먼저 등록해야 흡수되지 않음
  path("<str:resume_uuid>/sections/", include((section_urlpatterns, "resume-sections"))),
  # Resume CRUD (router 가 다른 경로를 집어삼키지 않도록 맨 마지막)
  path("", include(router.urls)),
]
