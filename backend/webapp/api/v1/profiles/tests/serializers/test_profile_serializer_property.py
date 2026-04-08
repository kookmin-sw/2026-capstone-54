from api.v1.profiles.serializers import ProfileSerializer
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from profiles.factories import JobCategoryFactory, JobFactory
from users.factories import UserFactory


class ProfileSerializerPropertyTests(TestCase):
  """Profile serializer required field validation property tests"""

  @given(email=st.emails())
  @settings(max_examples=5, deadline=None)
  def test_job_category_required_validation(self, email):
    """
        Property 12: Job Category Required Validation

        **Validates: Requirements 11.1**
        """
    user = UserFactory(email=email)

    category = JobCategoryFactory(emoji="💻", name=f"Category-{email}"[:100])
    job = JobFactory(name="Developer", category=category)

    serializer = ProfileSerializer(
      data={"job_ids": [job.id]}, context={"request": type('obj', (object, ), {"user": user})()}
    )

    self.assertFalse(serializer.is_valid())
    self.assertIn("job_category_id", serializer.errors)

  @given(
    email=st.emails(),
    category_name=st.text(
      min_size=1,
      max_size=100,
      alphabet=st.characters(min_codepoint=32, max_codepoint=126, blacklist_characters="\x00")
    ),
  )
  @settings(max_examples=5, deadline=None)
  def test_jobs_required_validation(self, email, category_name):
    """
        Property 13: Jobs Required Validation

        **Validates: Requirements 11.2**
        """
    user = UserFactory(email=email)

    category = JobCategoryFactory(emoji="💻", name=category_name)

    serializer = ProfileSerializer(
      data={
        "job_category_id": category.id,
        "job_ids": []
      },
      context={"request": type('obj', (object, ), {"user": user})()}
    )

    self.assertFalse(serializer.is_valid())
    self.assertIn("job_ids", serializer.errors)
