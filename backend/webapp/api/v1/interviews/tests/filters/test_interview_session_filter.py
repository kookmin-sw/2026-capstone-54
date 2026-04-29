"""InterviewSessionFilter 테스트 — InterviewSessionViewSet 의 list 액션을 통해 필터 동작 검증."""

import uuid

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from interviews.enums import (
  InterviewDifficultyLevel,
  InterviewPracticeMode,
  InterviewSessionStatus,
  InterviewSessionType,
  InterviewSttMode,
)
from interviews.factories import InterviewSessionFactory
from interviews.models import InterviewSession
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from subscriptions.factories import SubscriptionFactory
from users.factories import UserFactory


class _AuthenticatedFilterTestCase(TestCase):
  """이메일 인증된 사용자 + Pro 구독 공통 setUp.

  Pro 플랜을 부여하여 7일 이전 세션도 응답에 포함되도록 하고,
  필터 동작만 단독으로 검증할 수 있게 한다.
  """

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory(email_confirmed_at=timezone.now())
    SubscriptionFactory.create(user=self.user, pro=True)
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.url = reverse("interview-session-list")

  def _result_uuids(self, response):
    """응답 결과에서 세션 UUID 집합을 추출한다."""
    return {item["uuid"] for item in response.data["results"]}


# ── interview_session_type ──────────────────────────────────────────────


class InterviewSessionTypeFilterTests(_AuthenticatedFilterTestCase):
  """interview_session_type 필터 동작 검증."""

  def setUp(self):
    super().setUp()
    self.followup_session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
    )
    self.full_process_session = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FULL_PROCESS,
    )

  def test_filter_by_followup_returns_only_followup(self):
    response = self.client.get(self.url, {"interview_session_type": InterviewSessionType.FOLLOWUP})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.followup_session.pk)})

  def test_filter_by_full_process_returns_only_full_process(self):
    response = self.client.get(self.url, {"interview_session_type": InterviewSessionType.FULL_PROCESS})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.full_process_session.pk)})

  def test_no_filter_returns_all_sessions(self):
    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(
      self._result_uuids(response),
      {str(self.followup_session.pk), str(self.full_process_session.pk)},
    )


# ── interview_session_status ────────────────────────────────────────────


class InterviewSessionStatusFilterTests(_AuthenticatedFilterTestCase):
  """interview_session_status 필터 동작 검증."""

  def setUp(self):
    super().setUp()
    self.in_progress = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.paused = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.PAUSED,
    )
    self.completed = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )

  def test_filter_by_in_progress_returns_only_in_progress(self):
    response = self.client.get(self.url, {"interview_session_status": InterviewSessionStatus.IN_PROGRESS})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.in_progress.pk)})

  def test_filter_by_paused_returns_only_paused(self):
    response = self.client.get(self.url, {"interview_session_status": InterviewSessionStatus.PAUSED})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.paused.pk)})

  def test_filter_by_completed_returns_only_completed(self):
    response = self.client.get(self.url, {"interview_session_status": InterviewSessionStatus.COMPLETED})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.completed.pk)})


# ── interview_difficulty_level ──────────────────────────────────────────


class InterviewDifficultyLevelFilterTests(_AuthenticatedFilterTestCase):
  """interview_difficulty_level 필터 동작 검증."""

  def setUp(self):
    super().setUp()
    self.friendly = InterviewSessionFactory(
      user=self.user,
      interview_difficulty_level=InterviewDifficultyLevel.FRIENDLY,
    )
    self.normal = InterviewSessionFactory(
      user=self.user,
      interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
    )
    self.pressure = InterviewSessionFactory(
      user=self.user,
      interview_difficulty_level=InterviewDifficultyLevel.PRESSURE,
    )

  def test_filter_by_friendly_returns_only_friendly(self):
    response = self.client.get(self.url, {"interview_difficulty_level": InterviewDifficultyLevel.FRIENDLY})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.friendly.pk)})

  def test_filter_by_normal_returns_only_normal(self):
    response = self.client.get(self.url, {"interview_difficulty_level": InterviewDifficultyLevel.NORMAL})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.normal.pk)})

  def test_filter_by_pressure_returns_only_pressure(self):
    response = self.client.get(self.url, {"interview_difficulty_level": InterviewDifficultyLevel.PRESSURE})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.pressure.pk)})


# ── interview_practice_mode ─────────────────────────────────────────────


class InterviewPracticeModeFilterTests(_AuthenticatedFilterTestCase):
  """interview_practice_mode 필터 동작 검증."""

  def setUp(self):
    super().setUp()
    self.practice = InterviewSessionFactory(
      user=self.user,
      interview_practice_mode=InterviewPracticeMode.PRACTICE,
    )
    self.real = InterviewSessionFactory(
      user=self.user,
      interview_practice_mode=InterviewPracticeMode.REAL,
    )

  def test_filter_by_practice_returns_only_practice(self):
    response = self.client.get(self.url, {"interview_practice_mode": InterviewPracticeMode.PRACTICE})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.practice.pk)})

  def test_filter_by_real_returns_only_real(self):
    response = self.client.get(self.url, {"interview_practice_mode": InterviewPracticeMode.REAL})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.real.pk)})


# ── stt_mode ────────────────────────────────────────────────────────────


class InterviewSttModeFilterTests(_AuthenticatedFilterTestCase):
  """stt_mode 필터 동작 검증."""

  def setUp(self):
    super().setUp()
    self.browser_session = InterviewSessionFactory(
      user=self.user,
      stt_mode=InterviewSttMode.BROWSER,
    )
    self.backend_session = InterviewSessionFactory(
      user=self.user,
      stt_mode=InterviewSttMode.BACKEND,
    )

  def test_filter_by_browser_returns_only_browser(self):
    response = self.client.get(self.url, {"stt_mode": InterviewSttMode.BROWSER})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.browser_session.pk)})

  def test_filter_by_backend_returns_only_backend(self):
    response = self.client.get(self.url, {"stt_mode": InterviewSttMode.BACKEND})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.backend_session.pk)})


# ── created_at_after / created_at_before ────────────────────────────────


class CreatedAtRangeFilterTests(_AuthenticatedFilterTestCase):
  """created_at_after / created_at_before 필터 동작 검증.

  Pro 플랜으로 무제한 히스토리를 확보한 뒤, 세션의 created_at 을 강제로 과거로 backdate 하여
  날짜 범위 필터 동작을 검증한다.
  """

  def setUp(self):
    super().setUp()
    self.now = timezone.now()
    self.old_session = InterviewSessionFactory(user=self.user)
    self.mid_session = InterviewSessionFactory(user=self.user)
    self.recent_session = InterviewSessionFactory(user=self.user)

    self._backdate(self.old_session, days=30)
    self._backdate(self.mid_session, days=15)
    self._backdate(self.recent_session, days=1)

  def _backdate(self, session, days):
    """세션의 created_at 을 N일 전으로 직접 갱신한다."""
    InterviewSession.objects.filter(pk=session.pk).update(
      created_at=self.now - timezone.timedelta(days=days),
      updated_at=self.now - timezone.timedelta(days=days),
    )

  def test_created_at_after_returns_sessions_at_or_after_threshold(self):
    """created_at_after 는 임계값 이후(gte) 세션을 반환한다."""
    threshold = (self.now - timezone.timedelta(days=20)).isoformat()

    response = self.client.get(self.url, {"created_at_after": threshold})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(
      self._result_uuids(response),
      {str(self.mid_session.pk), str(self.recent_session.pk)},
    )

  def test_created_at_before_returns_sessions_at_or_before_threshold(self):
    """created_at_before 는 임계값 이전(lte) 세션을 반환한다."""
    threshold = (self.now - timezone.timedelta(days=10)).isoformat()

    response = self.client.get(self.url, {"created_at_before": threshold})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(
      self._result_uuids(response),
      {str(self.old_session.pk), str(self.mid_session.pk)},
    )

  def test_created_at_range_combined(self):
    """created_at_after + created_at_before 조합으로 범위 필터링된다."""
    after = (self.now - timezone.timedelta(days=20)).isoformat()
    before = (self.now - timezone.timedelta(days=10)).isoformat()

    response = self.client.get(self.url, {"created_at_after": after, "created_at_before": before})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.mid_session.pk)})

  def test_created_at_range_with_no_match_returns_empty(self):
    """범위에 해당하는 세션이 없으면 빈 결과를 반환한다."""
    after = (self.now + timezone.timedelta(days=1)).isoformat()

    response = self.client.get(self.url, {"created_at_after": after})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), set())


# ── resume_uuid ─────────────────────────────────────────────────────────


class ResumeUuidFilterTests(_AuthenticatedFilterTestCase):
  """resume_uuid 필터 동작 검증."""

  def setUp(self):
    super().setUp()
    self.session_a = InterviewSessionFactory(user=self.user)
    self.session_b = InterviewSessionFactory(user=self.user)

  def test_filter_by_resume_uuid_returns_matching_session(self):
    response = self.client.get(self.url, {"resume_uuid": str(self.session_a.resume.pk)})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.session_a.pk)})

  def test_filter_by_unknown_resume_uuid_returns_empty(self):
    response = self.client.get(self.url, {"resume_uuid": str(uuid.uuid4())})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), set())

  def test_filter_by_invalid_resume_uuid_returns_400(self):
    response = self.client.get(self.url, {"resume_uuid": "not-a-uuid"})

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ── user_job_description_uuid ───────────────────────────────────────────


class UserJobDescriptionUuidFilterTests(_AuthenticatedFilterTestCase):
  """user_job_description_uuid 필터 동작 검증."""

  def setUp(self):
    super().setUp()
    self.session_a = InterviewSessionFactory(user=self.user)
    self.session_b = InterviewSessionFactory(user=self.user)

  def test_filter_by_user_job_description_uuid_returns_matching_session(self):
    response = self.client.get(
      self.url,
      {"user_job_description_uuid": str(self.session_a.user_job_description.pk)},
    )

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.session_a.pk)})

  def test_filter_by_unknown_user_job_description_uuid_returns_empty(self):
    response = self.client.get(self.url, {"user_job_description_uuid": str(uuid.uuid4())})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), set())

  def test_filter_by_invalid_user_job_description_uuid_returns_400(self):
    response = self.client.get(self.url, {"user_job_description_uuid": "not-a-uuid"})

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# ── 다중 필터 조합 / 다른 사용자 격리 ──────────────────────────────────


class CombinedFiltersTests(_AuthenticatedFilterTestCase):
  """여러 필터가 동시에 적용될 때 AND 조건으로 결합되는지 검증."""

  def setUp(self):
    super().setUp()
    self.target = InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.COMPLETED,
      interview_difficulty_level=InterviewDifficultyLevel.PRESSURE,
    )
    # 동일 type + status 이지만 difficulty 다른 세션
    InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.COMPLETED,
      interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
    )
    # 동일 type + difficulty 이지만 status 다른 세션
    InterviewSessionFactory(
      user=self.user,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
      interview_difficulty_level=InterviewDifficultyLevel.PRESSURE,
    )

  def test_combined_filters_apply_as_and(self):
    """여러 필터는 AND 조건으로 결합되어 모두 만족하는 세션만 반환된다."""
    response = self.client.get(
      self.url,
      {
        "interview_session_type": InterviewSessionType.FOLLOWUP,
        "interview_session_status": InterviewSessionStatus.COMPLETED,
        "interview_difficulty_level": InterviewDifficultyLevel.PRESSURE,
      },
    )

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(self.target.pk)})

  def test_combined_filters_with_no_match_returns_empty(self):
    response = self.client.get(
      self.url,
      {
        "interview_session_type": InterviewSessionType.FULL_PROCESS,
        "interview_session_status": InterviewSessionStatus.COMPLETED,
      },
    )

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), set())


class FilterIsolationTests(_AuthenticatedFilterTestCase):
  """필터를 적용해도 다른 사용자의 세션은 절대 반환되지 않는지 검증."""

  def test_filter_does_not_return_other_users_sessions(self):
    """동일 status 의 다른 사용자 세션은 결과에 포함되지 않는다."""
    own = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    InterviewSessionFactory(interview_session_status=InterviewSessionStatus.COMPLETED, )  # 다른 사용자

    response = self.client.get(self.url, {"interview_session_status": InterviewSessionStatus.COMPLETED})

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(self._result_uuids(response), {str(own.pk)})
