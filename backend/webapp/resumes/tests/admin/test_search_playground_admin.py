from unittest.mock import patch

from django.test import RequestFactory, TestCase
from resumes.admin.search_playground_admin import SearchPlaygroundAdmin, SearchPlaygroundProxy
from resumes.enums import AnalysisStatus
from resumes.factories import ResumeEmbeddingFactory, ResumeFactory
from users.factories import UserFactory

FAKE_VECTOR = [0.1] * 1536


class SearchPlaygroundAdminTests(TestCase):
  """SearchPlaygroundAdmin 테스트."""

  def setUp(self):
    from django.contrib.admin.sites import AdminSite
    self.site = AdminSite()
    self.admin = SearchPlaygroundAdmin(SearchPlaygroundProxy, self.site)
    self.factory = RequestFactory()
    self.staff_user = UserFactory(is_staff=True, is_superuser=True)
    self.resume = ResumeFactory(
      user=self.staff_user,
      analysis_status=AnalysisStatus.COMPLETED,
      is_active=True,
    )
    self.embedding = ResumeEmbeddingFactory(
      user=self.staff_user,
      resume=self.resume,
      embedding_vector=FAKE_VECTOR,
    )

  def test_추가_권한_없음(self):
    """proxy model이므로 추가 권한이 없다."""
    request = self.factory.get("/")
    request.user = self.staff_user
    self.assertFalse(self.admin.has_add_permission(request))

  def test_수정_권한_없음(self):
    """proxy model이므로 수정 권한이 없다."""
    request = self.factory.get("/")
    request.user = self.staff_user
    self.assertFalse(self.admin.has_change_permission(request))

  def test_search_playground_권한(self):
    """staff 사용자는 검색 플레이그라운드에 접근할 수 있다."""
    request = self.factory.get("/")
    request.user = self.staff_user
    self.assertTrue(self.admin.has_search_playground_permission(request))

  @patch("resumes.services.search_resume_embedding_service.embed_query", return_value=(FAKE_VECTOR, 5))
  def test_search_playground_GET(self, mock_embed):
    """GET 요청 시 폼이 렌더링된다."""
    request = self.factory.get("/admin/resumes/searchplaygroundproxy/search-playground/")
    request.user = self.staff_user
    response = self.admin.search_playground(request)
    self.assertEqual(response.status_code, 200)

  def test_user_resumes_json(self):
    """사용자별 이력서 목록 JSON이 반환된다."""
    request = self.factory.get("/")
    request.user = self.staff_user
    response = SearchPlaygroundAdmin._user_resumes_json(request, self.staff_user.id)
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response["Content-Type"], "application/json")
