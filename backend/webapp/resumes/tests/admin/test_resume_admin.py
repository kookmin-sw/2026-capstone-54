from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory, TestCase
from resumes.admin import ResumeAdmin
from resumes.factories import ResumeFactory
from resumes.models import Resume
from users.factories import UserFactory


class ResumeAdminTests(TestCase):
  """ResumeAdmin 테스트."""

  def setUp(self):
    self.site = AdminSite()
    self.admin = ResumeAdmin(Resume, self.site)
    self.factory = RequestFactory()
    self.staff_user = UserFactory(is_staff=True, is_superuser=True)

  def test_list_display_필드(self):
    """list_display에 필수 필드가 포함되어 있다."""
    self.assertIn("uuid", self.admin.list_display)
    self.assertIn("analysis_status", self.admin.list_display)
    self.assertIn("analysis_step", self.admin.list_display)

  def test_changelist_접근(self):
    """staff 사용자가 changelist에 접근할 수 있다."""
    request = self.factory.get("/admin/resumes/resume/")
    request.user = self.staff_user
    ResumeFactory()
    response = self.admin.changelist_view(request)
    self.assertEqual(response.status_code, 200)
