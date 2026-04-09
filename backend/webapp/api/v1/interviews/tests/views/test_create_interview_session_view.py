from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewDifficultyLevel, InterviewSessionStatus, InterviewSessionType
from interviews.models import InterviewSession
from job_descriptions.factories import UserJobDescriptionFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from resumes.factories import ResumeFactory
from users.factories import UserFactory


class CreateInterviewSessionViewTests(TestCase):
  """CreateInterviewSessionView POST 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.resume = ResumeFactory(user=self.user)
    self.ujd = UserJobDescriptionFactory(user=self.user)
    self.url = reverse("interview-session-create")

  def _payload(self, **kwargs):
    data = {
      "resume_uuid": str(self.resume.pk),
      "user_job_description_uuid": str(self.ujd.pk),
      "interview_session_type": InterviewSessionType.FOLLOWUP,
      "interview_difficulty_level": InterviewDifficultyLevel.NORMAL,
    }
    data.update(kwargs)
    return data

  def test_creates_session_and_returns_201(self):
    """유효한 데이터로 세션을 생성하면 201을 반환한다."""
    response = self.client.post(self.url, data=self._payload(), format="json")
    self.assertEqual(response.status_code, status.HTTP_201_CREATED)

  def test_session_is_persisted_to_db(self):
    """생성된 세션이 DB에 저장된다."""
    self.client.post(self.url, data=self._payload(), format="json")
    self.assertEqual(InterviewSession.objects.filter(user=self.user).count(), 1)

  def test_response_contains_session_uuid(self):
    """응답에 세션 UUID가 포함된다."""
    response = self.client.post(self.url, data=self._payload(), format="json")
    self.assertIn("uuid", response.data)

  def test_response_contains_correct_session_type(self):
    """응답에 올바른 세션 유형이 포함된다."""
    response = self.client.post(
      self.url, data=self._payload(interview_session_type=InterviewSessionType.FULL_PROCESS), format="json"
    )
    self.assertEqual(response.data["interview_session_type"], InterviewSessionType.FULL_PROCESS)

  def test_default_status_is_in_progress(self):
    """생성된 세션의 기본 상태는 in_progress이다."""
    response = self.client.post(self.url, data=self._payload(), format="json")
    self.assertEqual(response.data["interview_session_status"], InterviewSessionStatus.IN_PROGRESS)

  def test_resume_not_owned_by_user_returns_404(self):
    """다른 사용자의 이력서 UUID를 사용하면 404를 반환한다."""
    other_resume = ResumeFactory()
    response = self.client.post(self.url, data=self._payload(resume_uuid=str(other_resume.pk)), format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_ujd_not_owned_by_user_returns_404(self):
    """다른 사용자의 채용공고 UUID를 사용하면 404를 반환한다."""
    other_ujd = UserJobDescriptionFactory()
    response = self.client.post(
      self.url, data=self._payload(user_job_description_uuid=str(other_ujd.pk)), format="json"
    )
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_invalid_session_type_returns_400(self):
    """유효하지 않은 세션 유형이면 400을 반환한다."""
    response = self.client.post(self.url, data=self._payload(interview_session_type="invalid_type"), format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_unauthenticated_request_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    response = self.client.post(self.url, data=self._payload(), format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_unverified_email_returns_403(self):
    """이메일 미인증 사용자의 요청은 403을 반환한다."""
    unverified = UserFactory(email_confirmed_at=None)
    token = RefreshToken.for_user(unverified)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    response = self.client.post(self.url, data=self._payload(), format="json")
    self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

  def test_missing_required_fields_returns_400(self):
    """필수 필드가 없으면 400을 반환한다."""
    response = self.client.post(self.url, data={}, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
