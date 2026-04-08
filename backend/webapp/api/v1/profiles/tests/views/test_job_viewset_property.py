from api.v1.profiles.views import JobListView
from django.utils import timezone
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from profiles.factories import JobCategoryFactory, JobFactory
from rest_framework.test import APIRequestFactory


class JobListViewPropertyTests(TestCase):
  """Job list and autocomplete API property tests"""

  @given(
    category_name=st.text(
      min_size=1,
      max_size=100,
      alphabet=st.characters(min_codepoint=32, max_codepoint=126, blacklist_characters="\x00")
    ),
    other_category_name=st.text(
      min_size=1,
      max_size=100,
      alphabet=st.characters(min_codepoint=32, max_codepoint=126, blacklist_characters="\x00")
    ),
    target_jobs=st.lists(
      st.text(
        min_size=1,
        max_size=100,
        alphabet=st.characters(min_codepoint=32, max_codepoint=126, blacklist_characters="\x00")
      ),
      min_size=1,
      max_size=5
    ),
    other_jobs=st.lists(
      st.text(
        min_size=1,
        max_size=100,
        alphabet=st.characters(min_codepoint=32, max_codepoint=126, blacklist_characters="\x00")
      ),
      min_size=1,
      max_size=5
    ),
  )
  @settings(max_examples=5, deadline=None)
  def test_job_filtering_by_category(self, category_name, other_category_name, target_jobs, other_jobs):
    """
        Property 7: Job Filtering by Category

        **Validates: Requirements 6.2**
        """
    from hypothesis import assume
    assume(category_name != other_category_name)

    opened_at = timezone.now()
    target_category = JobCategoryFactory(emoji="💻", name=category_name, opened_at=opened_at)
    target_job_ids = [
      JobFactory(name=job_name, category=target_category, opened_at=opened_at).id for job_name in target_jobs
    ]

    other_category = JobCategoryFactory(emoji="📢", name=other_category_name, opened_at=opened_at)
    for job_name in other_jobs:
      JobFactory(name=job_name, category=other_category, opened_at=opened_at)

    factory = APIRequestFactory()
    request = factory.get(f"/api/v1/job-categories/{target_category.id}/jobs/")
    view = JobListView.as_view()
    response = view(request, job_category_id=target_category.id)

    self.assertEqual(response.status_code, 200)
    returned_ids = [item["id"] for item in response.data["results"]]
    self.assertEqual(set(returned_ids), set(target_job_ids))

  @given(
    query=st.text(
      min_size=1, max_size=50, alphabet=st.characters(min_codepoint=32, max_codepoint=126, blacklist_characters="\x00")
    ),
  )
  @settings(max_examples=5, deadline=None)
  def test_autocomplete_search_similarity_and_ranking(self, query):
    """
        Property 8: Autocomplete Search Similarity and Ranking

        **Validates: Requirements 7.2, 7.4**
        """
    opened_at = timezone.now()
    category = JobCategoryFactory(emoji="💻", name="Test Category", opened_at=opened_at)
    for i in range(10):
      JobFactory(name=f"Job {i} {query}", category=category, opened_at=opened_at)

    factory = APIRequestFactory()
    request = factory.get(f"/api/v1/job-categories/{category.id}/jobs/?search={query}")
    view = JobListView.as_view()
    response = view(request, job_category_id=category.id)

    self.assertEqual(response.status_code, 200)
    self.assertLessEqual(len(response.data["results"]), 10)

  @given(st.just(None))
  @settings(max_examples=1, deadline=None)
  def test_autocomplete_result_limit(self, _):
    """
        Property 9: Autocomplete Result Limit

        **Validates: Requirements 7.5**
        """
    opened_at = timezone.now()
    category = JobCategoryFactory(emoji="💻", name="Test Category", opened_at=opened_at)
    for i in range(20):
      JobFactory(name=f"Job {i}", category=category, opened_at=opened_at)

    factory = APIRequestFactory()

    request = factory.get(f"/api/v1/job-categories/{category.id}/jobs/?search=Job")
    view = JobListView.as_view()
    response = view(request, job_category_id=category.id)

    self.assertEqual(response.status_code, 200)
    self.assertLessEqual(len(response.data["results"]), 10)
