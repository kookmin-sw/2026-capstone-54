from api.v1.profiles.views import JobCategoryViewSet
from django.utils import timezone
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from profiles.factories import JobCategoryFactory
from rest_framework.test import APIRequestFactory


class JobCategoryViewSetPropertyTests(TestCase):
  """Job category list API property tests"""

  @given(
    categories=st.lists(
      st.tuples(
        st.text(min_size=1, max_size=10, alphabet=st.characters(blacklist_categories=("Cs", "Cc"))),
        st.text(
          min_size=1,
          max_size=100,
          alphabet=st.characters(min_codepoint=32, max_codepoint=126, blacklist_characters="\x00")
        )
      ),
      min_size=1,
      max_size=10,
      unique_by=lambda x: x[1]
    )
  )
  @settings(max_examples=5, deadline=None)
  def test_job_category_list_completeness(self, categories):
    """
        Property 5: Job Category List Completeness

        **Validates: Requirements 5.2**
        """
    opened_at = timezone.now()
    created_categories = [JobCategoryFactory(emoji=emoji, name=name, opened_at=opened_at) for emoji, name in categories]

    factory = APIRequestFactory()
    request = factory.get("/api/v1/job-categories/")
    view = JobCategoryViewSet.as_view({"get": "list"})
    response = view(request)

    self.assertEqual(response.status_code, 200)
    results = response.data.get("results", response.data)
    self.assertGreaterEqual(len(results), len(created_categories))

    for item in results:
      self.assertIn("id", item)
      self.assertIn("emoji", item)
      self.assertIn("name", item)

  @given(st.just(None))
  @settings(max_examples=1, deadline=None)
  def test_job_category_list_ordering_consistency(self, _):
    """
        Property 6: Job Category List Ordering Consistency

        **Validates: Requirements 5.3**
        """
    opened_at = timezone.now()
    JobCategoryFactory(emoji="💻", name="IT", opened_at=opened_at)
    JobCategoryFactory(emoji="📢", name="Marketing", opened_at=opened_at)
    JobCategoryFactory(emoji="💰", name="Finance", opened_at=opened_at)

    factory = APIRequestFactory()
    request = factory.get("/api/v1/job-categories/")
    view = JobCategoryViewSet.as_view({"get": "list"})

    response1 = view(request)
    response2 = view(request)

    results1 = response1.data.get("results", response1.data)
    results2 = response2.data.get("results", response2.data)

    ids1 = [item["id"] for item in results1]
    ids2 = [item["id"] for item in results2]

    self.assertEqual(ids1, ids2)
