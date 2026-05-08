import uuid

from api.v1.interviews.tests.ownership_test_helpers import OwnershipHeadersMixin
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.constants import (
  FOLLOWUP_ANCHOR_COUNT,
  FULL_PROCESS_QUESTION_COUNT,
  MAX_FOLLOWUP_PER_ANCHOR,
)
from interviews.enums import InterviewExchangeType, InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


def _create_followup_session_turns(session) -> None:
  """FOLLOWUP 세션을 종료 가능한 상태로 만들기 위한 모든 턴 생성.

  앵커 + 앵커당 꼬리질문(MAX_FOLLOWUP_PER_ANCHOR) 으로 총
  FOLLOWUP_ANCHOR_COUNT * (1 + MAX_FOLLOWUP_PER_ANCHOR) 개 턴이 모두 답변됨.
  """
  for anchor_idx in range(FOLLOWUP_ANCHOR_COUNT):
    anchor = InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      answer=f"앵커 답변 {anchor_idx + 1}",
      turn_number=anchor_idx + 1,
      followup_order=None,
    )
    for followup_idx in range(MAX_FOLLOWUP_PER_ANCHOR):
      InterviewTurnFactory(
        interview_session=session,
        turn_type=InterviewExchangeType.FOLLOWUP,
        answer=f"꼬리 답변 {anchor_idx + 1}-{followup_idx + 1}",
        turn_number=anchor_idx + 1,
        followup_order=followup_idx + 1,
        anchor_turn=anchor,
      )


def _create_full_process_session_turns(session) -> None:
  """FULL_PROCESS 세션을 종료 가능한 상태로 만들기 위한 모든 턴 생성.

  FULL_PROCESS_QUESTION_COUNT 개 모두 답변된 상태.
  """
  for idx in range(FULL_PROCESS_QUESTION_COUNT):
    InterviewTurnFactory(
      interview_session=session,
      turn_type=InterviewExchangeType.INITIAL,
      answer=f"답변 {idx + 1}",
      turn_number=idx + 1,
      followup_order=None,
    )


class FinishInterviewViewCompletedTests(OwnershipHeadersMixin, TestCase):
  """FinishInterviewView — 정상 종료(상수 수식 기준 모든 답변 완료) 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.authenticate_with_ownership(self.user, self.session)
    _create_followup_session_turns(self.session)
    self.url = reverse("interview-finish", kwargs={"interview_session_uuid": str(self.session.pk)})

  def test_returns_200(self):
    """정상 종료 시 200을 반환한다."""
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_session_status_set_to_completed(self):
    """모든 답변이 완료된 경우 세션 상태가 completed로 변경된다."""
    self.client.post(self.url)
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.COMPLETED)

  def test_response_contains_session_data(self):
    """응답에 세션 데이터가 포함된다."""
    response = self.client.post(self.url)
    self.assertIn("uuid", response.data)
    self.assertIn("interview_session_status", response.data)


class FinishInterviewViewFullProcessCompletedTests(OwnershipHeadersMixin, TestCase):
  """FinishInterviewView — FULL_PROCESS 정상 종료 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.authenticate_with_ownership(self.user, self.session)
    _create_full_process_session_turns(self.session)
    self.url = reverse("interview-finish", kwargs={"interview_session_uuid": str(self.session.pk)})

  def test_returns_200(self):
    """FULL_PROCESS 모든 답변 완료 시 200을 반환한다."""
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_session_status_set_to_completed(self):
    """FULL_PROCESS 모든 답변 완료 시 completed 상태로 변경된다."""
    self.client.post(self.url)
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.COMPLETED)


class FinishInterviewViewWithUnansweredTurnsTests(OwnershipHeadersMixin, TestCase):
  """FinishInterviewView — 미답변 턴이 있으면 종료 불가 (보고서 생성 방지)"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.authenticate_with_ownership(self.user, self.session)
    InterviewTurnFactory(interview_session=self.session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=self.session, answer="", turn_number=2)
    self.url = reverse("interview-finish", kwargs={"interview_session_uuid": str(self.session.pk)})

  def test_returns_400(self):
    """미답변 턴이 있으면 400을 반환한다."""
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_error_code_is_interview_not_completed(self):
    """미답변 턴이 있으면 INTERVIEW_NOT_COMPLETED error_code 를 반환한다."""
    response = self.client.post(self.url)
    self.assertEqual(response.data.get("error_code"), "INTERVIEW_NOT_COMPLETED")

  def test_session_status_remains_in_progress(self):
    """미답변 턴이 있으면 세션 상태가 in_progress 로 유지된다."""
    self.client.post(self.url)
    self.session.refresh_from_db()
    self.assertEqual(self.session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)


class FinishInterviewViewIncompleteTurnCountTests(OwnershipHeadersMixin, TestCase):
  """FinishInterviewView — 상수 수식 기준 턴 수 부족 시 종료 불가"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.authenticate_with_ownership(self.user, self.session)
    InterviewTurnFactory(interview_session=self.session, answer="답변1", turn_number=1)
    InterviewTurnFactory(interview_session=self.session, answer="답변2", turn_number=2)
    self.url = reverse("interview-finish", kwargs={"interview_session_uuid": str(self.session.pk)})

  def test_returns_400_when_followup_turns_below_expected(self):
    """앵커만 답변되고 꼬리질문이 생성되지 않은 상태에서는 종료할 수 없다."""
    response = self.client.post(self.url)
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    self.assertEqual(response.data.get("error_code"), "INTERVIEW_NOT_COMPLETED")


class FinishInterviewViewErrorTests(OwnershipHeadersMixin, TestCase):
  """FinishInterviewView — 오류 케이스 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

  def _authorize_for_session(self, session) -> None:
    self.authenticate_with_ownership(self.user, session)

  def test_already_completed_session_returns_error(self):
    """이미 완료된 세션에 finish를 시도하면 에러를 반환한다."""
    session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    self._authorize_for_session(session)
    url = reverse("interview-finish", kwargs={"interview_session_uuid": str(session.pk)})
    response = self.client.post(url)
    self.assertIn(
      response.status_code,
      [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN, status.HTTP_422_UNPROCESSABLE_ENTITY]
    )

  def test_other_user_session_returns_404(self):
    """다른 사용자의 세션이면 404를 반환한다."""
    other_session = InterviewSessionFactory()
    url = reverse("interview-finish", kwargs={"interview_session_uuid": str(other_session.pk)})
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    session = InterviewSessionFactory(user=self.user)
    url = reverse("interview-finish", kwargs={"interview_session_uuid": str(session.pk)})
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_nonexistent_session_returns_404(self):
    """존재하지 않는 세션 UUID이면 404를 반환한다."""
    url = reverse("interview-finish", kwargs={"interview_session_uuid": str(uuid.uuid4())})
    response = self.client.post(url)
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
