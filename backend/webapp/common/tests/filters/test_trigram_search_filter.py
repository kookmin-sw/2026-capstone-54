from common.filters import TrigramSearchFilter
from django.test import TestCase
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory
from users.factories import UserFactory
from users.models import User


class MockView:
  """TrigramSearchFilter 테스트용 뷰 스텁"""

  def __init__(self, search_fields, threshold=0.1, limit=None):
    self.search_fields = search_fields
    self.trigram_threshold = threshold
    self.trigram_limit = limit


def make_request(query=""):
  """DRF Request 생성 헬퍼"""
  factory = APIRequestFactory()
  django_request = factory.get("/", {"search": query} if query else {})
  return Request(django_request)


class TrigramSearchFilterTest(TestCase):
  """TrigramSearchFilter 단위 테스트"""

  def setUp(self):
    self.filter = TrigramSearchFilter()
    UserFactory(name="백엔드 개발자")
    UserFactory(name="프론트엔드 개발자")
    UserFactory(name="마케터")

  def test_no_search_term_returns_full_queryset(self):
    """검색어 없으면 전체 쿼리셋 반환"""
    queryset = User.objects.all()
    view = MockView(search_fields=["name"])
    request = make_request(query="")

    result = self.filter.filter_queryset(request, queryset, view)

    self.assertEqual(result.count(), 3)

  def test_search_returns_similar_results(self):
    """검색어와 유사한 항목 반환"""
    queryset = User.objects.all()
    view = MockView(search_fields=["name"])
    request = make_request(query="개발자")

    result = list(self.filter.filter_queryset(request, queryset, view))

    self.assertGreater(len(result), 0)
    names = [u.name for u in result]
    self.assertTrue(any("개발자" in name for name in names))

  def test_unrelated_query_returns_empty(self):
    """관련 없는 검색어는 결과 없음"""
    queryset = User.objects.all()
    view = MockView(search_fields=["name"], threshold=0.5)
    request = make_request(query="xyzxyzxyz")

    result = list(self.filter.filter_queryset(request, queryset, view))

    self.assertEqual(len(result), 0)

  def test_trigram_limit_caps_results(self):
    """trigram_limit 설정 시 결과 개수 제한"""
    for i in range(20):
      UserFactory(name=f"개발자 {i}")

    queryset = User.objects.all()
    view = MockView(search_fields=["name"], limit=5)
    request = make_request(query="개발자")

    result = list(self.filter.filter_queryset(request, queryset, view))

    self.assertLessEqual(len(result), 5)

  def test_no_limit_returns_all_matches(self):
    """trigram_limit 미설정 시 매칭 결과 전부 반환"""
    for i in range(10):
      UserFactory(name=f"개발자 {i}")

    queryset = User.objects.all()
    view = MockView(search_fields=["name"], limit=None)
    request = make_request(query="개발자")

    result = list(self.filter.filter_queryset(request, queryset, view))

    self.assertGreater(len(result), 5)

  def test_results_ordered_by_similarity_descending(self):
    """결과가 유사도 내림차순으로 정렬"""
    queryset = User.objects.all()
    view = MockView(search_fields=["name"])
    request = make_request(query="개발자")

    result = list(self.filter.filter_queryset(request, queryset, view))

    similarities = [u.similarity for u in result]
    self.assertEqual(similarities, sorted(similarities, reverse=True))

  def test_schema_operation_parameters_returns_search_param(self):
    """drf-spectacular가 인식하는 search 파라미터 자동 생성 확인"""
    params = self.filter.get_schema_operation_parameters(MockView(search_fields=["name"]))

    self.assertEqual(len(params), 1)
    self.assertEqual(params[0]["name"], "search")
