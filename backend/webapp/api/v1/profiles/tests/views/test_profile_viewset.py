from django.test import TestCase
from django.utils import timezone
from profiles.factories import JobCategoryFactory, JobFactory
from profiles.models import Profile
from rest_framework.test import APIClient
from users.factories import UserFactory


class ProfileMeViewTest(TestCase):
  """ProfileMeView 단위 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    self.category = JobCategoryFactory(emoji="💻", name="IT/개발")
    self.job = JobFactory(name="백엔드 개발자", category=self.category)

  def test_profile_creation_with_verified_email(self):
    """이메일 인증된 사용자의 프로필 생성 테스트"""
    self.user.email_confirmed_at = timezone.now()
    self.user.save()
    self.client.force_authenticate(user=self.user)

    response = self.client.post("/api/v1/profiles/me/", {"job_category_id": self.category.id, "job_ids": [self.job.id]})

    self.assertEqual(response.status_code, 201)
    self.assertEqual(response.data["job_category"]["id"], self.category.id)
    job_ids = [j["id"] for j in response.data["jobs"]]
    self.assertIn(self.job.id, job_ids)

  def test_profile_creation_fails_without_verified_email(self):
    """이메일 미인증 사용자의 프로필 생성 실패 테스트"""
    self.user.email_confirmed_at = None
    self.user.save()
    self.client.force_authenticate(user=self.user)

    response = self.client.post("/api/v1/profiles/me/", {"job_category_id": self.category.id, "job_ids": [self.job.id]})

    self.assertEqual(response.status_code, 403)

  def test_profile_upsert_updates_existing_profile(self):
    """프로필이 이미 있을 때 POST는 수정(200)을 반환"""
    self.user.email_confirmed_at = timezone.now()
    self.user.profile_completed_at = timezone.now()
    self.user.save()
    profile = Profile.objects.create(user=self.user, job_category=self.category)
    profile.jobs.add(self.job)

    self.client.force_authenticate(user=self.user)

    new_category = JobCategoryFactory(emoji="📢", name="마케팅")
    new_job = JobFactory(name="마케터", category=new_category)

    response = self.client.post("/api/v1/profiles/me/", {"job_category_id": new_category.id, "job_ids": [new_job.id]})

    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data["job_category"]["id"], new_category.id)

  def test_profile_update_preserves_profile_completed_at(self):
    """프로필 수정 시 profile_completed_at 보존 테스트"""
    self.user.email_confirmed_at = timezone.now()
    original_completed_at = timezone.now()
    self.user.profile_completed_at = original_completed_at
    self.user.save()
    profile = Profile.objects.create(user=self.user, job_category=self.category)
    profile.jobs.add(self.job)

    self.client.force_authenticate(user=self.user)

    new_category = JobCategoryFactory(emoji="📢", name="마케팅")
    new_job = JobFactory(name="마케터", category=new_category)

    self.client.post("/api/v1/profiles/me/", {"job_category_id": new_category.id, "job_ids": [new_job.id]})

    self.user.refresh_from_db()
    self.assertEqual(self.user.profile_completed_at, original_completed_at)

  def test_get_profile_returns_own_profile(self):
    """GET /profiles/me/ 는 자신의 프로필 반환"""
    self.user.email_confirmed_at = timezone.now()
    self.user.save()
    profile = Profile.objects.create(user=self.user, job_category=self.category)
    profile.jobs.add(self.job)

    self.client.force_authenticate(user=self.user)
    response = self.client.get("/api/v1/profiles/me/")

    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data["job_category"]["id"], self.category.id)

  def test_get_profile_returns_404_when_no_profile(self):
    """프로필이 없으면 GET은 404 반환"""
    self.user.email_confirmed_at = timezone.now()
    self.user.save()
    self.client.force_authenticate(user=self.user)

    response = self.client.get("/api/v1/profiles/me/")

    self.assertEqual(response.status_code, 404)

  def test_profile_creation_with_missing_job_category_fails(self):
    """job_category_id 없이 프로필 생성 실패 테스트"""
    self.user.email_confirmed_at = timezone.now()
    self.user.save()
    self.client.force_authenticate(user=self.user)

    response = self.client.post("/api/v1/profiles/me/", {"job_ids": [self.job.id]})

    self.assertEqual(response.status_code, 400)
    self.assertIn("job_category_id", response.data.get("field_errors", response.data))

  def test_profile_creation_with_empty_jobs_fails(self):
    """job_ids 없이 프로필 생성 실패 테스트"""
    self.user.email_confirmed_at = timezone.now()
    self.user.save()
    self.client.force_authenticate(user=self.user)

    response = self.client.post("/api/v1/profiles/me/", {"job_category_id": self.category.id, "job_ids": []})

    self.assertEqual(response.status_code, 400)
    self.assertIn("job_ids", response.data.get("field_errors", response.data))
