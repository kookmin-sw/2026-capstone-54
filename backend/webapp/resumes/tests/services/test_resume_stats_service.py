from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from resumes.enums import AnalysisStatus
from resumes.factories import FileResumeFactory, TextResumeFactory
from resumes.services.resume_stats_service import (
  ResumeCountStatsService,
  ResumeRecentActivityStatsService,
  ResumeTopSkillsStatsService,
  ResumeTypeStatsService,
)
from users.factories import UserFactory


class ResumeCountStatsServiceTests(TestCase):
  """ResumeCountStatsService 테스트."""

  def setUp(self):
    self.user = UserFactory()
    self.other_user = UserFactory()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_aggregates_counts_scoped_to_user(self, mock_send_task):
    """전체/상태별/활성별 개수를 현재 사용자 기준으로 집계한다."""
    TextResumeFactory(user=self.user, is_active=True, analysis_status=AnalysisStatus.COMPLETED)
    TextResumeFactory(user=self.user, is_active=True, analysis_status=AnalysisStatus.PROCESSING)
    TextResumeFactory(user=self.user, is_active=False, analysis_status=AnalysisStatus.FAILED)
    TextResumeFactory(user=self.other_user, is_active=True, analysis_status=AnalysisStatus.COMPLETED)

    stats = ResumeCountStatsService(user=self.user).perform()

    self.assertEqual(stats["total"], 3)
    self.assertEqual(stats["completed"], 1)
    self.assertEqual(stats["processing"], 1)
    self.assertEqual(stats["failed"], 1)
    self.assertEqual(stats["active"], 2)
    self.assertEqual(stats["inactive"], 1)

  def test_returns_zero_when_no_resumes(self):
    """이력서가 하나도 없으면 모든 카운트가 0 이다."""
    stats = ResumeCountStatsService(user=self.user).perform()
    self.assertEqual(stats["total"], 0)
    self.assertEqual(stats["active"], 0)


class ResumeTypeStatsServiceTests(TestCase):
  """ResumeTypeStatsService 테스트."""

  def setUp(self):
    self.user = UserFactory()

  @patch("resumes.services.mixins.file_resume_pipeline_mixin.default_storage")
  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_aggregates_counts_by_type(self, mock_send_task, mock_storage):
    """file / text 타입별 개수를 집계한다."""
    TextResumeFactory(user=self.user)
    TextResumeFactory(user=self.user)
    FileResumeFactory(user=self.user)

    stats = ResumeTypeStatsService(user=self.user).perform()

    self.assertEqual(stats["text_count"], 2)
    self.assertEqual(stats["file_count"], 1)


class ResumeTopSkillsStatsServiceTests(TestCase):
  """ResumeTopSkillsStatsService 테스트."""

  def setUp(self):
    self.user = UserFactory()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_aggregates_skills_from_grouped_schema(self, mock_send_task):
    """parsed_data 의 skills 그룹 전체(technical/tools/…)에서 스킬을 집계한다."""
    TextResumeFactory(
      user=self.user,
      is_parsed=True,
      parsed_data={"skills": {
        "technical": ["Python", "Django"],
        "tools": ["Docker"],
        "soft": [],
        "languages": [],
      }},
    )
    TextResumeFactory(
      user=self.user,
      is_parsed=True,
      parsed_data={"skills": {
        "technical": ["Python", "React"],
        "soft": [],
        "tools": [],
        "languages": []
      }},
    )

    stats = ResumeTopSkillsStatsService(user=self.user, limit=5).perform()
    top_names = {s["name"]: s["count"] for s in stats["top_skills"]}
    self.assertEqual(top_names["Python"], 2)
    self.assertEqual(top_names.get("Django"), 1)
    self.assertEqual(top_names.get("Docker"), 1)
    self.assertEqual(stats["total_unique_skills"], 4)

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_supports_legacy_list_format(self, mock_send_task):
    """skills 가 list 형태여도 집계한다 (구형 포맷 호환)."""
    TextResumeFactory(
      user=self.user,
      is_parsed=True,
      parsed_data={"skills": ["Python", "FastAPI"]},
    )
    stats = ResumeTopSkillsStatsService(user=self.user).perform()
    self.assertEqual(stats["total_unique_skills"], 2)

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_excludes_unparsed_resumes(self, mock_send_task):
    """is_parsed=False 인 이력서의 parsed_data 는 집계하지 않는다."""
    TextResumeFactory(user=self.user, is_parsed=False, parsed_data={"skills": ["NotCounted"]})
    stats = ResumeTopSkillsStatsService(user=self.user).perform()
    self.assertEqual(stats["total_unique_skills"], 0)


class ResumeRecentActivityStatsServiceTests(TestCase):
  """ResumeRecentActivityStatsService 테스트."""

  def setUp(self):
    self.user = UserFactory()

  @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
  def test_counts_only_resumes_analyzed_within_window(self, mock_send_task):
    """지정된 days 이내에 분석 완료된 이력서만 집계한다."""
    now = timezone.now()
    TextResumeFactory(
      user=self.user,
      analysis_status=AnalysisStatus.COMPLETED,
      analyzed_at=now,
    )
    # 10일 전의 오래된 이력서 — 7일 윈도우 밖이라 제외되어야 한다
    old_resume = TextResumeFactory(
      user=self.user,
      analysis_status=AnalysisStatus.COMPLETED,
    )
    old_resume.analyzed_at = now - timezone.timedelta(days=10)
    old_resume.save(update_fields=["analyzed_at"])

    stats = ResumeRecentActivityStatsService(user=self.user, days=7).perform()
    self.assertEqual(stats["days"], 7)
    self.assertEqual(stats["recently_analyzed_count"], 1)
