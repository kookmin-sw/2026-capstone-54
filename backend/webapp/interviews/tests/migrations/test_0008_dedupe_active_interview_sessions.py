import importlib.util
from datetime import timedelta
from pathlib import Path

from django.test import TestCase
from django.utils import timezone
from interviews.enums import InterviewSessionStatus
from interviews.factories import InterviewSessionFactory
from interviews.models import InterviewSession
from users.factories import UserFactory

_MIGRATION_PATH = (
  Path(__file__).resolve().parent.parent.parent / "migrations" / "0008_dedupe_active_interview_sessions.py"
)


def _load_migration_module():
  """마이그레이션 파일을 동적 로드하여 _dedupe 함수에 접근 가능하게 한다."""
  spec = importlib.util.spec_from_file_location("interviews_migration_0008", _MIGRATION_PATH)
  mod = importlib.util.module_from_spec(spec)
  spec.loader.exec_module(mod)
  return mod


class DedupeActiveInterviewSessionsMigrationTests(TestCase):

  def setUp(self):
    self.dedupe = _load_migration_module()._dedupe
    self.user = UserFactory()
    from django.db import connection
    with connection.cursor() as cursor:
      cursor.execute("DROP INDEX IF EXISTS uq_active_interview_session_per_user;")

  def test_dedupe_keeps_most_recent_in_progress_when_two_in_progress_for_same_user(self):
    """같은 user 의 IN_PROGRESS 2 개 중 가장 최근 1 개만 유지된다."""
    older = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    newer = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)

    InterviewSession.objects.filter(pk=older.pk).update(updated_at=timezone.now() - timedelta(hours=1))

    self.dedupe(InterviewSession)

    older.refresh_from_db()
    newer.refresh_from_db()
    self.assertEqual(older.interview_session_status, InterviewSessionStatus.COMPLETED)
    self.assertEqual(newer.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_dedupe_keeps_most_recent_when_in_progress_and_paused_mixed(self):
    """IN_PROGRESS 와 PAUSED 가 섞여 있을 때도 가장 최근 1 개만 그 상태로 유지된다."""
    paused = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.PAUSED)
    in_progress = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    InterviewSession.objects.filter(pk=paused.pk).update(updated_at=timezone.now() - timedelta(hours=1))

    self.dedupe(InterviewSession)

    paused.refresh_from_db()
    in_progress.refresh_from_db()
    self.assertEqual(paused.interview_session_status, InterviewSessionStatus.COMPLETED)
    self.assertEqual(in_progress.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_dedupe_does_nothing_when_only_one_active_session(self):
    """활성 세션이 1 개뿐일 때는 변경되지 않는다."""
    only = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)

    self.dedupe(InterviewSession)

    only.refresh_from_db()
    self.assertEqual(only.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_dedupe_does_nothing_when_only_completed_sessions(self):
    """COMPLETED 세션만 있을 때는 변경되지 않는다."""
    s1 = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.COMPLETED)
    s2 = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.COMPLETED)

    self.dedupe(InterviewSession)

    s1.refresh_from_db()
    s2.refresh_from_db()
    self.assertEqual(s1.interview_session_status, InterviewSessionStatus.COMPLETED)
    self.assertEqual(s2.interview_session_status, InterviewSessionStatus.COMPLETED)

  def test_dedupe_does_not_affect_other_users(self):
    """다른 사용자의 활성 세션은 영향받지 않는다."""
    other_user = UserFactory()
    other_session = InterviewSessionFactory(
      user=other_user, interview_session_status=InterviewSessionStatus.IN_PROGRESS
    )

    older = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    newer = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    InterviewSession.objects.filter(pk=older.pk).update(updated_at=timezone.now() - timedelta(hours=1))

    self.dedupe(InterviewSession)

    newer.refresh_from_db()
    older.refresh_from_db()
    other_session.refresh_from_db()

    self.assertEqual(other_session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)
    self.assertEqual(older.interview_session_status, InterviewSessionStatus.COMPLETED)
    self.assertEqual(newer.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_dedupe_uses_created_at_as_tiebreaker_when_updated_at_equal(self):
    """updated_at 동일 시 created_at 내림차순으로 가장 최근을 유지한다."""
    older = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    newer = InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)

    same_time = timezone.now()
    InterviewSession.objects.filter(pk=older.pk).update(updated_at=same_time)
    InterviewSession.objects.filter(pk=newer.pk).update(updated_at=same_time)

    self.dedupe(InterviewSession)

    older.refresh_from_db()
    newer.refresh_from_db()
    self.assertEqual(older.interview_session_status, InterviewSessionStatus.COMPLETED)
    self.assertEqual(newer.interview_session_status, InterviewSessionStatus.IN_PROGRESS)
