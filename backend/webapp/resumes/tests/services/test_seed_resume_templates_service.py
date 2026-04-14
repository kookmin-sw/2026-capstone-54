from django.test import TestCase
from profiles.factories.job_factory import JobFactory
from resumes.factories import ResumeTextContentTemplateFactory
from resumes.models import ResumeTextContentTemplate
from resumes.services.seed_resume_templates_service import (
  DEFAULT_TEMPLATE_CONTENT,
  TEMPLATE_CONTENT_BY_KEYWORD,
  SeedResumeTemplatesService,
)


class SeedResumeTemplatesServiceTests(TestCase):
  """SeedResumeTemplatesService 테스트."""

  def test_creates_one_template_per_job(self):
    """각 Job 마다 템플릿이 1 개씩 생성된다."""
    JobFactory(name="프론트엔드 개발자")
    JobFactory(name="백엔드 개발자")

    created = SeedResumeTemplatesService.perform()

    self.assertEqual(created, 2)
    self.assertEqual(ResumeTextContentTemplate.objects.count(), 2)

  def test_skips_jobs_that_already_have_templates(self):
    """이미 템플릿이 존재하면 중복 생성하지 않는다."""
    job = JobFactory(name="디지털 마케터")
    ResumeTextContentTemplateFactory(job=job, title="기존 템플릿")

    created = SeedResumeTemplatesService.perform()

    self.assertEqual(created, 0)
    self.assertEqual(ResumeTextContentTemplate.objects.filter(job=job).count(), 1)

  def test_uses_keyword_matched_content(self):
    """Job.name 에 '프론트엔드' 가 포함되면 프론트엔드용 본문이 사용된다."""
    JobFactory(name="프론트엔드 개발자")

    SeedResumeTemplatesService.perform()
    template = ResumeTextContentTemplate.objects.get(job__name="프론트엔드 개발자")
    self.assertEqual(template.content, TEMPLATE_CONTENT_BY_KEYWORD["프론트엔드"])

  def test_falls_back_to_default_content_when_no_keyword_matches(self):
    """Job.name 에 매칭되는 키워드가 없으면 DEFAULT_TEMPLATE_CONTENT 를 사용한다."""
    JobFactory(name="특수한 직무명")

    SeedResumeTemplatesService.perform()
    template = ResumeTextContentTemplate.objects.get(job__name="특수한 직무명")
    self.assertEqual(template.content, DEFAULT_TEMPLATE_CONTENT)

  def test_title_equals_job_name(self):
    """생성되는 템플릿의 title 은 Job.name 과 동일해야 한다 (suffix 없음)."""
    JobFactory(name="백엔드 개발자")

    SeedResumeTemplatesService.perform()
    template = ResumeTextContentTemplate.objects.get(job__name="백엔드 개발자")
    self.assertEqual(template.title, "백엔드 개발자")
