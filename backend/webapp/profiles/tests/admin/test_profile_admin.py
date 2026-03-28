from django.contrib.admin.sites import AdminSite
from django.test import TestCase
from profiles.admin import ProfileAdmin
from profiles.models import Profile


class ProfileAdminTest(TestCase):
  """ProfileAdmin 테스트"""

  def setUp(self):
    self.site = AdminSite()
    self.admin = ProfileAdmin(Profile, self.site)

  def test_profile_admin_list_display(self):
    """ProfileAdmin list_display 테스트"""
    self.assertEqual(self.admin.list_display, ["user", "job_category", "created_at", "updated_at"])

  def test_profile_admin_list_filter(self):
    """ProfileAdmin list_filter 테스트"""
    self.assertEqual(self.admin.list_filter, ["job_category", "created_at"])

  def test_profile_admin_search_fields(self):
    """ProfileAdmin search_fields 테스트"""
    self.assertEqual(self.admin.search_fields, ["user__email", "user__name"])

  def test_profile_admin_raw_id_fields(self):
    """ProfileAdmin raw_id_fields 테스트"""
    self.assertEqual(self.admin.raw_id_fields, ["user"])

  def test_profile_admin_filter_horizontal(self):
    """ProfileAdmin filter_horizontal 테스트"""
    self.assertEqual(self.admin.filter_horizontal, ["jobs"])
