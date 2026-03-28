from django.contrib.admin.sites import AdminSite
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory, TestCase
from django.utils import timezone
from profiles.admin import JobAdmin
from profiles.factories import JobCategoryFactory, JobFactory
from profiles.models import Job
from users.factories import UserFactory


class JobAdminTest(TestCase):
  """JobAdmin 테스트"""

  def setUp(self):
    self.site = AdminSite()
    self.admin = JobAdmin(Job, self.site)
    self.staff_user = UserFactory(is_staff=True)

  def _make_request(self):
    request = RequestFactory().post("/")
    request.user = self.staff_user
    setattr(request, "session", "session")
    messages = FallbackStorage(request)
    setattr(request, "_messages", messages)
    return request

  def test_job_admin_list_display(self):
    """JobAdmin list_display 테스트"""
    self.assertEqual(
      self.admin.list_display, ["name", "category", "is_opened", "opened_at", "created_at", "updated_at"]
    )

  def test_job_admin_list_filter(self):
    """JobAdmin list_filter 테스트"""
    self.assertEqual(self.admin.list_filter, ["category", "opened_at", "created_at"])

  def test_job_admin_search_fields(self):
    """JobAdmin search_fields 테스트"""
    self.assertEqual(self.admin.search_fields, ["name", "category__name"])

  def test_job_admin_ordering(self):
    """JobAdmin ordering 테스트"""
    self.assertEqual(self.admin.ordering, ["category", "name"])

  def test_bulk_open_jobs_opens_closed_jobs(self):
    """bulk_open_jobs 액션이 닫힌 직업들을 오픈 처리"""
    category = JobCategoryFactory()
    job1 = JobFactory(category=category, opened_at=None)
    job2 = JobFactory(category=category, opened_at=None)

    request = self._make_request()
    queryset = Job.objects.filter(pk__in=[job1.pk, job2.pk])
    self.admin.bulk_open_jobs(request, queryset)

    job1.refresh_from_db()
    job2.refresh_from_db()
    self.assertIsNotNone(job1.opened_at)
    self.assertIsNotNone(job2.opened_at)

  def test_bulk_close_jobs_closes_open_jobs(self):
    """bulk_close_jobs 액션이 오픈된 직업들을 닫기 처리"""
    category = JobCategoryFactory()
    opened_at = timezone.now()
    job1 = JobFactory(category=category, opened_at=opened_at)
    job2 = JobFactory(category=category, opened_at=opened_at)

    request = self._make_request()
    queryset = Job.objects.filter(pk__in=[job1.pk, job2.pk])
    self.admin.bulk_close_jobs(request, queryset)

    job1.refresh_from_db()
    job2.refresh_from_db()
    self.assertIsNone(job1.opened_at)
    self.assertIsNone(job2.opened_at)

  def test_open_job_opens_closed_job(self):
    """open_job 액션이 닫힌 직업을 오픈 처리"""
    category = JobCategoryFactory()
    job = JobFactory(category=category, opened_at=None)

    request = self._make_request()
    self.admin.open_job(request, job.pk)

    job.refresh_from_db()
    self.assertIsNotNone(job.opened_at)

  def test_open_job_skips_already_open_job(self):
    """open_job 액션이 이미 오픈된 직업은 변경하지 않음"""
    category = JobCategoryFactory()
    original_opened_at = timezone.now()
    job = JobFactory(category=category, opened_at=original_opened_at)

    request = self._make_request()
    self.admin.open_job(request, job.pk)

    job.refresh_from_db()
    self.assertEqual(job.opened_at, original_opened_at)

  def test_close_job_closes_open_job(self):
    """close_job 액션이 오픈된 직업을 닫기 처리"""
    category = JobCategoryFactory()
    job = JobFactory(category=category, opened_at=timezone.now())

    request = self._make_request()
    self.admin.close_job(request, job.pk)

    job.refresh_from_db()
    self.assertIsNone(job.opened_at)

  def test_close_job_skips_already_closed_job(self):
    """close_job 액션이 이미 닫힌 직업은 변경하지 않음"""
    category = JobCategoryFactory()
    job = JobFactory(category=category, opened_at=None)

    request = self._make_request()
    self.admin.close_job(request, job.pk)

    job.refresh_from_db()
    self.assertIsNone(job.opened_at)
