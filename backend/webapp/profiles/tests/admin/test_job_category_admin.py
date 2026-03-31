from django.contrib.admin.sites import AdminSite
from django.test import TestCase
from profiles.admin import JobCategoryAdmin
from profiles.models import JobCategory


class JobCategoryAdminTest(TestCase):
  """JobCategoryAdmin 테스트"""

  def setUp(self):
    self.site = AdminSite()
    self.admin = JobCategoryAdmin(JobCategory, self.site)

  def test_job_category_admin_list_display(self):
    """JobCategoryAdmin list_display 테스트"""
    self.assertEqual(self.admin.list_display, ["emoji", "name", "is_opened", "opened_at", "created_at", "updated_at"])

  def test_job_category_admin_search_fields(self):
    """JobCategoryAdmin search_fields 테스트"""
    self.assertEqual(self.admin.search_fields, ["name"])

  def test_job_category_admin_ordering(self):
    """JobCategoryAdmin ordering 테스트"""
    self.assertEqual(self.admin.ordering, ["name"])
