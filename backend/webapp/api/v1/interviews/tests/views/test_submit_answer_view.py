from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from interviews.services.submit_answer_and_generate_followup_service import FollowupResult
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory


class SubmitAnswerViewFollowupTests(TestCase):
  """SubmitAnswerView — FOLLOWUP 세션 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
      total_followup_questions=0,
    )
    self.turn = InterviewTurnFactory(interview_session=self.session, answer="", turn_number=1)
    self.url = reverse(
      "interview-answer",
      kwargs={
        "interview_session_uuid": str(self.session.pk),
        "turn_pk": self.turn.pk
      },
    )

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerAndGenerateFollowupService")
  def test_returns_201_with_followup_format(self, MockService):
    """FOLLOWUP 세션 답변 제출 시 201과 올바른 응답 형식을 반환한다."""
    followup_turn = InterviewTurnFactory.build(interview_session=self.session)
    MockService.return_value.perform.return_value = FollowupResult(turns=[followup_turn], followup_exhausted=False)

    response = self.client.post(self.url, data={"answer": "내 답변"}, format="json")

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertIn("turns", response.data)
    self.assertIn("followup_exhausted", response.data)

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerAndGenerateFollowupService")
  def test_followup_exhausted_true_in_response(self, MockService):
    """꼬리질문 한도 도달 시 followup_exhausted가 True이다."""
    MockService.return_value.perform.return_value = FollowupResult(turns=[], followup_exhausted=True)

    response = self.client.post(self.url, data={"answer": "내 답변"}, format="json")

    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    self.assertTrue(response.data["followup_exhausted"])
    self.assertEqual(response.data["turns"], [])

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerAndGenerateFollowupService")
  def test_service_called_with_correct_args(self, MockService):
    """서비스가 올바른 인수로 호출된다."""
    MockService.return_value.perform.return_value = FollowupResult(turns=[], followup_exhausted=False)

    self.client.post(self.url, data={"answer": "테스트 답변"}, format="json")

    MockService.assert_called_once_with(
      interview_session=self.session,
      interview_turn=self.turn,
      answer="테스트 답변",
    )


class SubmitAnswerViewFullProcessTests(TestCase):
  """SubmitAnswerView — FULL_PROCESS 세션 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
    )
    self.turn = InterviewTurnFactory(interview_session=self.session, answer="", turn_number=1)
    self.url = reverse(
      "interview-answer",
      kwargs={
        "interview_session_uuid": str(self.session.pk),
        "turn_pk": self.turn.pk
      },
    )

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerForFullProcessService")
  def test_returns_200_with_next_turn_data(self, MockService):
    """다음 턴이 있으면 200과 다음 턴 데이터를 반환한다."""
    next_turn = InterviewTurnFactory.build(interview_session=self.session)
    MockService.return_value.perform.return_value = next_turn

    response = self.client.post(self.url, data={"answer": "내 답변"}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerForFullProcessService")
  def test_returns_200_with_completion_message_when_all_answered(self, MockService):
    """모든 질문에 답변하면 200과 완료 메시지를 반환한다."""
    MockService.return_value.perform.return_value = None

    response = self.client.post(self.url, data={"answer": "마지막 답변"}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn("detail", response.data)
    self.assertEqual(response.data["detail"], "모든 질문에 답변하였습니다.")


class SubmitAnswerViewAuthTests(TestCase):
  """SubmitAnswerView 인증/권한 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.turn = InterviewTurnFactory(interview_session=self.session, answer="")

  def test_unauthenticated_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    url = reverse(
      "interview-answer",
      kwargs={
        "interview_session_uuid": str(self.session.pk),
        "turn_pk": self.turn.pk
      },
    )
    response = self.client.post(url, data={"answer": "답변"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  def test_other_user_session_returns_404(self):
    """다른 사용자의 세션이면 404를 반환한다."""
    other_session = InterviewSessionFactory(interview_session_type=InterviewSessionType.FOLLOWUP)
    other_turn = InterviewTurnFactory(interview_session=other_session)
    url = reverse(
      "interview-answer",
      kwargs={
        "interview_session_uuid": str(other_session.pk),
        "turn_pk": other_turn.pk
      },
    )
    response = self.client.post(url, data={"answer": "답변"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_turn_not_in_session_returns_404(self):
    """해당 세션에 속하지 않는 턴 PK이면 404를 반환한다."""
    other_turn = InterviewTurnFactory()
    url = reverse(
      "interview-answer",
      kwargs={
        "interview_session_uuid": str(self.session.pk),
        "turn_pk": other_turn.pk
      },
    )
    response = self.client.post(url, data={"answer": "답변"}, format="json")
    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_missing_answer_field_returns_400(self):
    """answer 필드가 없으면 400을 반환한다."""
    url = reverse(
      "interview-answer",
      kwargs={
        "interview_session_uuid": str(self.session.pk),
        "turn_pk": self.turn.pk
      },
    )
    response = self.client.post(url, data={}, format="json")
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
