"""InterviewSession 유니크 제약조건 테스트."""

from django.db import IntegrityError, transaction
from django.test import TestCase
from interviews.enums import InterviewSessionStatus
from interviews.factories.interview_session_factory import InterviewSessionFactory
from users.factories import UserFactory


class InterviewSessionUniqueConstraintTests(TestCase):
  """InterviewSession의 활성 세션(in_progress, paused) 유니크 인덱스 제약조건 검증 테스트."""

  def setUp(self):
    self.user = UserFactory()

  def test_cannot_create_second_in_progress_for_same_user(self):
    """동일한 사용자에 대해 두 번째 IN_PROGRESS 상태의 면접 세션을 생성할 수 없다."""
    InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )

    with self.assertRaises(IntegrityError):
      with transaction.atomic():
        InterviewSessionFactory(
          user=self.user,
          interview_session_status=InterviewSessionStatus.IN_PROGRESS,
        )

  def test_cannot_create_paused_when_in_progress_exists(self):
    """이미 IN_PROGRESS 상태의 세션이 있는 경우 PAUSED 상태의 세션을 생성할 수 없다."""
    InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )

    with self.assertRaises(IntegrityError):
      with transaction.atomic():
        InterviewSessionFactory(
          user=self.user,
          interview_session_status=InterviewSessionStatus.PAUSED,
        )

  def test_can_create_in_progress_when_only_completed_exists(self):
    """기존 세션들이 모두 COMPLETED 상태라면 새로운 IN_PROGRESS 세션을 생성할 수 있다."""
    InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )
    InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    )

    session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_can_create_in_progress_for_different_users(self):
    """다른 사용자는 각각 하나씩 IN_PROGRESS 세션을 가질 수 있다."""
    InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )

    another_user = UserFactory()
    another_session = InterviewSessionFactory(
      user=another_user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.assertEqual(another_session.user, another_user)

  def test_can_create_in_progress_after_existing_marked_completed(self):
    """기존 IN_PROGRESS 세션을 COMPLETED로 변경한 후 새로운 IN_PROGRESS 세션을 생성할 수 있다."""
    session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )

    session.mark_completed()

    new_session = InterviewSessionFactory(
      user=self.user,
      interview_session_status=InterviewSessionStatus.IN_PROGRESS,
    )
    self.assertEqual(new_session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)
