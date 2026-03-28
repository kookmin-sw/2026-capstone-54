from django.contrib.admin.sites import AdminSite
from django.test import TestCase
from profiles.admin import JobAdmin
from profiles.models import Job


class JobAdminTest(TestCase):
  """JobAdmin 테스트"""

  def setUp(self):
    self.site = AdminSite()
    self.admin = JobAdmin(Job, self.site)

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
