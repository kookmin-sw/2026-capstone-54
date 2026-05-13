from api.v1.profiles.views import ProfileMeView
from django.utils import timezone
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from profiles.factories import JobCategoryFactory, JobFactory
from profiles.models import Profile
from rest_framework.test import APIRequestFactory, force_authenticate
from users.factories import UserFactory


class ProfileMeViewPropertyTests(TestCase):
  """Profile API property tests"""

  @given(
    email=st.emails(),
    category_name=st.text(
      min_size=1,
      max_size=100,
      alphabet=st.characters(min_codepoint=32, max_codepoint=126, blacklist_characters="\x00"),
    ),
    job_names=st.lists(
      st.text(
        min_size=1,
        max_size=100,
        alphabet=st.characters(min_codepoint=32, max_codepoint=126, blacklist_characters="\x00"),
      ),
      min_size=1,
      max_size=5,
    ),
  )
  @settings(max_examples=5, deadline=None)
  def test_profile_data_persistence(self, email, category_name, job_names):
    """
        Property 4: Profile Data Persistence

        **Validates: Requirements 4.3, 4.5**
        """
    user = UserFactory(email=email)
    user.email_confirmed_at = timezone.now()
    user.save()

    category = JobCategoryFactory(emoji="💻", name=category_name)
    job_ids = [JobFactory(name=job_name, category=category).id for job_name in job_names]

    factory = APIRequestFactory()
    request = factory.post("/api/v1/profiles/me/", {"job_category_id": category.id, "job_ids": job_ids})
    force_authenticate(request, user=user)

    view = ProfileMeView.as_view()
    response = view(request)

    self.assertEqual(response.status_code, 201)
    self.assertEqual(response.data["job_category"]["id"], category.id)
    self.assertEqual({j["id"] for j in response.data["jobs"]}, set(job_ids))

    profile = Profile.objects.get(user=user)
    self.assertEqual(profile.job_category.id, category.id)
    self.assertEqual(set(profile.jobs.values_list("id", flat=True)), set(job_ids))

  @given(email=st.emails())
  @settings(max_examples=5, deadline=None)
  def test_profile_completion_timestamp_set_on_creation(self, email):
    """
        Property 10: Profile Completion Timestamp Set on Creation

        **Validates: Requirements 10.1**
        """
    user = UserFactory(email=email)
    user.email_confirmed_at = timezone.now()
    user.profile_completed_at = None
    user.save()

    category = JobCategoryFactory(emoji="💻", name=f"Cat-{email[:50]}")
    job = JobFactory(name="Developer", category=category)

    factory = APIRequestFactory()
    request = factory.post(
      "/api/v1/profiles/me/",
      {
        "job_category_id": category.id,
        "job_ids": [job.id]
      },
    )
    force_authenticate(request, user=user)

    view = ProfileMeView.as_view()
    response = view(request)

    self.assertEqual(response.status_code, 201)

    user.refresh_from_db()
    self.assertIsNotNone(user.profile_completed_at)

  @given(
    email_local=st.text(
      min_size=1,
      max_size=20,
      alphabet=st.characters(min_codepoint=97, max_codepoint=122),
    ),
    email_domain=st.text(
      min_size=1,
      max_size=20,
      alphabet=st.characters(min_codepoint=97, max_codepoint=122),
    ),
  )
  @settings(max_examples=5, deadline=None)
  def test_profile_completion_timestamp_preserved_on_update(self, email_local, email_domain):
    """
        Property 11: Profile Completion Timestamp Preserved on Update

        **Validates: Requirements 10.2**
        """
    email = f"{email_local}@{email_domain}.com"
    user = UserFactory(email=email)
    user.email_confirmed_at = timezone.now()
    original_completed_at = timezone.now()
    user.profile_completed_at = original_completed_at
    user.save()

    category = JobCategoryFactory(emoji="💻", name=f"Cat1-{email_local[:10]}")
    job = JobFactory(name="Developer", category=category)
    profile = Profile.objects.create(user=user, job_category=category)
    profile.jobs.add(job)

    updated_category = JobCategoryFactory(emoji="📢", name=f"Cat2-{email_local[:10]}")
    updated_job = JobFactory(name="Marketer", category=updated_category)

    factory = APIRequestFactory()
    request = factory.post(
      "/api/v1/profiles/me/",
      {
        "job_category_id": updated_category.id,
        "job_ids": [updated_job.id]
      },
    )
    force_authenticate(request, user=user)

    view = ProfileMeView.as_view()
    response = view(request)

    self.assertEqual(response.status_code, 200)

    user.refresh_from_db()
    self.assertEqual(user.profile_completed_at, original_completed_at)
