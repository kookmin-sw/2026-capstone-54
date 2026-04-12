"""InterviewSessionViewSet 테스트 — list / create / retrieve."""

import uuid

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import (
  InterviewDifficultyLevel,
  InterviewSessionStatus,
  InterviewSessionType,
)
from interviews.factories import InterviewSessionFactory
from interviews.models import InterviewSession
from job_descriptions.factories import UserJobDescriptionFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory
from users.factories import UserFactory


class _AuthenticatedTestCase(TestCase):
  """인증된 사용자 공통 setUp."""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")


# ── LIST (GET /interview-sessions/) ─────────────────────────────────────


class InterviewSessionListTests(_AuthenticatedTestCase):
  """GET /interview-sessions/ 목록 조회 테스트."""

  def setUp(self):
    super().setUp()
    self.url = reverse("interview-session-list")

  def test_returns_200(self):
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_returns_only_own_sessions(self):
    InterviewSessionFactory(user=self.user)
    InterviewSessionFactory(user=self.user)
    InterviewSessionFactory()  # 다른 사용자
    response = self.client.get(self.url)
    self.assertEqual(len(response.data["results"]), 2)

  def test_ordered_by_created_at_desc(self):
    s1 = InterviewSessionFactory(user=self.user)
    s2 = InterviewSessionFactory(user=self.user)
    response = self.client.get(self.url)
    uuids = [r["uuid"] for r in response.data["results"]]
    self.assertEqual(uuids, [str(s2.pk), str(s1.pk)])

  def test_unauthenticated_returns_401(self):
    self.client.credentials()
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_unverified_email_returns_403(self):
    unverified = UserFactory(email_confirmed_at=None)
    token = RefreshToken.for_user(unverified)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ── CREATE (POST /interview-sessions/) ──────────────────────────────────


class InterviewSessionCreateTests(_AuthenticatedTestCase):
  """POST /interview-sessions/ 세션 생성 테스트."""

  def setUp(self):
    super().setUp()
    self.resume = ResumeFactory(user=self.user)
    self.ujd = UserJobDescriptionFactory(user=self.user)
    self.url = reverse("interview-session-list")

  def _payload(self, **overrides):
    data = {
      "resume_uuid": str(self.resume.pk),
      "user_job_description_uuid": str(self.ujd.pk),
      "interview_session_type": InterviewSessionType.FOLLOWUP,
      "interview_difficulty_level": InterviewDifficultyLevel.NORMAL,
    }
    data.update(overrides)
    return data

  def test_creates_session_and_returns_201(self):
    response = self.client.post(self.url, data=self._payload(), format="json")
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)

  def test_session_persisted_to_db(self):
    self.client.post(self.url, data=self._payload(), format="json")
    self.assertEqual(InterviewSession.objects.filter(user=self.user).count(), 1)

  def test_response_contains_uuid(self):
    response = self.client.post(self.url, data=self._payload(), format="json")
    self.assertIn("uuid", response.data)

  def test_response_contains_correct_session_type(self):
    response = self.client.post(
      self.url,
      data=self._payload(interview_session_type=InterviewSessionType.FULL_PROCESS),
      format="json",
    )
    self.assertEqual(response.data["interview_session_type"], InterviewSessionType.FULL_PROCESS)

  def test_default_status_is_in_progress(self):
    response = self.client.post(self.url, data=self._payload(), format="json")
    self.assertEqual(response.data["interview_session_status"], InterviewSessionStatus.IN_PROGRESS)

  def test_other_users_resume_returns_404(self):
    other_resume = ResumeFactory()
    response = self.client.post(self.url, data=self._payload(resume_uuid=str(other_resume.pk)), format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_other_users_ujd_returns_404(self):
    other_ujd = UserJobDescriptionFactory()
    response = self.client.post(
      self.url, data=self._payload(user_job_description_uuid=str(other_ujd.pk)), format="json"
    )
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_invalid_session_type_returns_400(self):
    response = self.client.post(self.url, data=self._payload(interview_session_type="invalid"), format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_missing_required_fields_returns_400(self):
    response = self.client.post(self.url, data={}, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_unauthenticated_returns_401(self):
    self.client.credentials()
    response = self.client.post(self.url, data=self._payload(), format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_unverified_email_returns_403(self):
    unverified = UserFactory(email_confirmed_at=None)
    token = RefreshToken.for_user(unverified)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    response = self.client.post(self.url, data=self._payload(), format="json")
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


# ── RETRIEVE (GET /interview-sessions/:pk/) ─────────────────────────────


class InterviewSessionRetrieveTests(_AuthenticatedTestCase):
  """GET /interview-sessions/:pk/ 단건 조회 테스트."""

  def setUp(self):
    super().setUp()
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.url = reverse("interview-session-detail", kwargs={"pk": str(self.session.pk)})

  def test_returns_200_with_session_data(self):
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_response_contains_uuid(self):
    response = self.client.get(self.url)
    self.assertEqual(str(response.data["uuid"]), str(self.session.pk))

  def test_response_contains_session_type(self):
    response = self.client.get(self.url)
    self.assertEqual(response.data["interview_session_type"], InterviewSessionType.FOLLOWUP)

  def test_other_users_session_returns_404(self):
    other_session = InterviewSessionFactory()
    url = reverse("interview-session-detail", kwargs={"pk": str(other_session.pk)})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_nonexistent_session_returns_404(self):
    url = reverse("interview-session-detail", kwargs={"pk": str(uuid.uuid4())})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_returns_401(self):
    self.client.credentials()
    response = self.client.get(self.url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_unverified_email_returns_403(self):
    unverified = UserFactory(email_confirmed_at=None)
    token = RefreshToken.for_user(unverified)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    session = InterviewSessionFactory(user=unverified)
    url = reverse("interview-session-detail", kwargs={"pk": str(session.pk)})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  def test_completed_session_returns_200(self):
    completed = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    url = reverse("interview-session-detail", kwargs={"pk": str(completed.pk)})
    response = self.client.get(url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)
