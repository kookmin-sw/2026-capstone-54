from unittest.mock import patch

from api.v1.interviews.tests.ownership_test_helpers import OwnershipHeadersMixin
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory, InterviewTurnFactory
from interviews.services.submit_answer_and_generate_followup_service import FollowupResult
from rest_framework import status
from rest_framework.test import APIClient
from users.factories import UserFactory


class SubmitAnswerViewFollowupTests(OwnershipHeadersMixin, TestCase):
  """SubmitAnswerView — FOLLOWUP 세션 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
      total_followup_questions=0,
    )
    self.authenticate_with_ownership(self.user, self.session)
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

  def test_paused_session_returns_400(self):
    """PAUSED 세션에 답변 제출 시 400 (ValidationException)."""
    self.session.mark_paused(reason="user_left_window")

    response = self.client.post(self.url, data={"answer": "내 답변"}, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SubmitAnswerViewFullProcessTests(OwnershipHeadersMixin, TestCase):
  """SubmitAnswerView — FULL_PROCESS 세션 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
    )
    self.authenticate_with_ownership(self.user, self.session)
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


class SubmitAnswerViewAuthTests(OwnershipHeadersMixin, TestCase):
  """SubmitAnswerView 인증/권한 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.authenticate_with_ownership(self.user, self.session)
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


class SubmitAnswerViewMetricsPersistenceTests(OwnershipHeadersMixin, TestCase):
  """SubmitAnswerView — 행동/발화 메트릭 저장 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
    )
    self.authenticate_with_ownership(self.user, self.session)
    self.turn = InterviewTurnFactory(interview_session=self.session, answer="", turn_number=1)
    self.url = reverse(
      "interview-answer",
      kwargs={
        "interview_session_uuid": str(self.session.pk),
        "turn_pk": self.turn.pk
      },
    )

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerAndGenerateFollowupService")
  def test_all_metrics_persist_to_turn(self, MockService):
    """4가지 메트릭을 모두 보내면 InterviewTurn에 저장된다."""
    MockService.return_value.perform.return_value = FollowupResult(turns=[], followup_exhausted=False)

    self.client.post(
      self.url,
      data={
        "answer": "내 답변",
        "gaze_away_count": 7,
        "head_away_count": 3,
        "speech_rate_sps": 5.42,
        "pillar_word_counts": {
          "음": 5,
          "어": 2
        },
      },
      format="json",
    )

    self.turn.refresh_from_db()
    self.assertEqual(self.turn.gaze_away_count, 7)
    self.assertEqual(self.turn.head_away_count, 3)
    self.assertAlmostEqual(self.turn.speech_rate_sps, 5.42, places=2)
    self.assertEqual(self.turn.pillar_word_counts, {"음": 5, "어": 2})

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerAndGenerateFollowupService")
  def test_metrics_omitted_falls_back_to_defaults(self, MockService):
    """메트릭 필드를 모두 생략해도 default 값으로 저장된다 (녹화 미사용 turn)."""
    MockService.return_value.perform.return_value = FollowupResult(turns=[], followup_exhausted=False)

    self.client.post(self.url, data={"answer": "내 답변"}, format="json")

    self.turn.refresh_from_db()
    self.assertEqual(self.turn.gaze_away_count, 0)
    self.assertEqual(self.turn.head_away_count, 0)
    self.assertIsNone(self.turn.speech_rate_sps)
    self.assertEqual(self.turn.pillar_word_counts, {})

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerAndGenerateFollowupService")
  def test_speech_rate_sps_explicit_null_is_accepted(self, MockService):
    """speech_rate_sps에 명시적으로 null을 보내도 정상 저장된다."""
    MockService.return_value.perform.return_value = FollowupResult(turns=[], followup_exhausted=False)

    self.client.post(
      self.url,
      data={
        "answer": "내 답변",
        "speech_rate_sps": None,
      },
      format="json",
    )

    self.turn.refresh_from_db()
    self.assertIsNone(self.turn.speech_rate_sps)

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerAndGenerateFollowupService")
  def test_partial_metrics_only_set_provided_fields_others_default(self, MockService):
    """일부 메트릭만 보내면 누락된 필드는 default로 저장된다."""
    MockService.return_value.perform.return_value = FollowupResult(turns=[], followup_exhausted=False)

    self.client.post(
      self.url,
      data={
        "answer": "내 답변",
        "gaze_away_count": 4
      },
      format="json",
    )

    self.turn.refresh_from_db()
    self.assertEqual(self.turn.gaze_away_count, 4)
    self.assertEqual(self.turn.head_away_count, 0)
    self.assertIsNone(self.turn.speech_rate_sps)
    self.assertEqual(self.turn.pillar_word_counts, {})

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerAndGenerateFollowupService")
  def test_empty_pillar_word_counts_dict_is_persisted(self, MockService):
    """pillar_word_counts에 빈 dict를 명시적으로 보내도 정상 저장된다."""
    MockService.return_value.perform.return_value = FollowupResult(turns=[], followup_exhausted=False)

    self.client.post(
      self.url,
      data={
        "answer": "내 답변",
        "pillar_word_counts": {}
      },
      format="json",
    )

    self.turn.refresh_from_db()
    self.assertEqual(self.turn.pillar_word_counts, {})


class SubmitAnswerViewMetricsValidationTests(OwnershipHeadersMixin, TestCase):
  """SubmitAnswerView — 메트릭 입력 검증 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.authenticate_with_ownership(self.user, self.session)
    self.turn = InterviewTurnFactory(interview_session=self.session, answer="", turn_number=1)
    self.url = reverse(
      "interview-answer",
      kwargs={
        "interview_session_uuid": str(self.session.pk),
        "turn_pk": self.turn.pk
      },
    )

  def test_negative_gaze_away_count_returns_400(self):
    """gaze_away_count가 음수이면 400을 반환한다."""
    response = self.client.post(
      self.url,
      data={
        "answer": "답변",
        "gaze_away_count": -1
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_negative_head_away_count_returns_400(self):
    """head_away_count가 음수이면 400을 반환한다."""
    response = self.client.post(
      self.url,
      data={
        "answer": "답변",
        "head_away_count": -1
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_negative_speech_rate_sps_returns_400(self):
    """speech_rate_sps가 음수이면 400을 반환한다."""
    response = self.client.post(
      self.url,
      data={
        "answer": "답변",
        "speech_rate_sps": -0.5
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_negative_pillar_word_count_value_returns_400(self):
    """pillar_word_counts의 value가 음수이면 400을 반환한다."""
    response = self.client.post(
      self.url,
      data={
        "answer": "답변",
        "pillar_word_counts": {
          "음": -1
        }
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_non_dict_pillar_word_counts_returns_400(self):
    """pillar_word_counts가 dict가 아니면 400을 반환한다."""
    response = self.client.post(
      self.url,
      data={
        "answer": "답변",
        "pillar_word_counts": ["음", "어"]
      },
      format="json",
    )
    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SubmitAnswerViewMetricsResponseTests(OwnershipHeadersMixin, TestCase):
  """SubmitAnswerView — 메트릭 필드가 응답 Serializer에 포함되는지 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    self.session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      total_questions=3,
    )
    self.authenticate_with_ownership(self.user, self.session)
    self.turn = InterviewTurnFactory(interview_session=self.session, answer="", turn_number=1)
    self.url = reverse(
      "interview-answer",
      kwargs={
        "interview_session_uuid": str(self.session.pk),
        "turn_pk": self.turn.pk
      },
    )

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerForFullProcessService")
  def test_response_turn_includes_metric_fields(self, MockService):
    """FullProcess 응답의 next turn 데이터에 4개 메트릭 필드가 포함된다."""
    next_turn = InterviewTurnFactory(interview_session=self.session, turn_number=2)
    MockService.return_value.perform.return_value = next_turn

    response = self.client.post(self.url, data={"answer": "답변"}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn("gaze_away_count", response.data)
    self.assertIn("head_away_count", response.data)
    self.assertIn("speech_rate_sps", response.data)
    self.assertIn("pillar_word_counts", response.data)

  @patch("api.v1.interviews.views.submit_answer_view.SubmitAnswerForFullProcessService")
  def test_response_metric_fields_have_default_values_for_unfilled_turn(self, MockService):
    """아직 메트릭이 기록되지 않은 next turn의 응답 값은 default이다."""
    next_turn = InterviewTurnFactory(interview_session=self.session, turn_number=2)
    MockService.return_value.perform.return_value = next_turn

    response = self.client.post(self.url, data={"answer": "답변"}, format="json")

    self.assertEqual(response.data["gaze_away_count"], 0)
    self.assertEqual(response.data["head_away_count"], 0)
    self.assertIsNone(response.data["speech_rate_sps"])
    self.assertEqual(response.data["pillar_word_counts"], {})
