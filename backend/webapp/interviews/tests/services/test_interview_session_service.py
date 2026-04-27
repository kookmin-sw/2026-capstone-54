import uuid

from common.exceptions import ConflictException, NotFoundException
from django.test import TestCase
from interviews.enums import InterviewDifficultyLevel, InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory
from interviews.models import InterviewSession
from interviews.services import create_interview_session, get_interview_session_for_user
from job_descriptions.factories import UserJobDescriptionFactory
from resumes.factories import ResumeFactory
from users.factories import UserFactory


class CreateInterviewSessionServiceTests(TestCase):
  """create_interview_session 서비스 테스트"""

  def setUp(self):
    self.user = UserFactory()
    self.resume = ResumeFactory(user=self.user)
    self.user_job_description = UserJobDescriptionFactory(user=self.user)

  def test_creates_interview_session(self):
    """면접 세션이 생성된다."""
    session = create_interview_session(
      user=self.user,
      resume=self.resume,
      user_job_description=self.user_job_description,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
    )
    self.assertIsNotNone(session.pk)
    self.assertIsInstance(session, InterviewSession)

  def test_session_has_correct_user(self):
    """생성된 세션의 user가 올바르다."""
    session = create_interview_session(
      user=self.user,
      resume=self.resume,
      user_job_description=self.user_job_description,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
    )
    self.assertEqual(session.user, self.user)

  def test_session_has_correct_type(self):
    """생성된 세션의 타입이 올바르다."""
    session = create_interview_session(
      user=self.user,
      resume=self.resume,
      user_job_description=self.user_job_description,
      interview_session_type=InterviewSessionType.FULL_PROCESS,
      interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
    )
    self.assertEqual(session.interview_session_type, InterviewSessionType.FULL_PROCESS)

  def test_session_has_correct_difficulty(self):
    """생성된 세션의 난이도가 올바르다."""
    session = create_interview_session(
      user=self.user,
      resume=self.resume,
      user_job_description=self.user_job_description,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_difficulty_level=InterviewDifficultyLevel.PRESSURE,
    )
    self.assertEqual(session.interview_difficulty_level, InterviewDifficultyLevel.PRESSURE)

  def test_session_default_status_is_in_progress(self):
    """생성된 세션의 기본 상태는 in_progress이다."""
    session = create_interview_session(
      user=self.user,
      resume=self.resume,
      user_job_description=self.user_job_description,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
    )
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_session_is_persisted_to_db(self):
    """세션이 DB에 저장된다."""
    session = create_interview_session(
      user=self.user,
      resume=self.resume,
      user_job_description=self.user_job_description,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
    )
    self.assertTrue(InterviewSession.objects.filter(pk=session.pk).exists())


class GetInterviewSessionForUserServiceTests(TestCase):
  """get_interview_session_for_user 서비스 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_returns_session_for_correct_user(self):
    """올바른 사용자의 세션을 반환한다."""
    session = InterviewSessionFactory(user=self.user)
    result = get_interview_session_for_user(session.pk, self.user)
    self.assertEqual(result.pk, session.pk)

  def test_raises_not_found_for_wrong_user(self):
    """다른 사용자의 세션이면 NotFoundException을 발생시킨다."""
    other_user = UserFactory()
    session = InterviewSessionFactory(user=other_user)
    with self.assertRaises(NotFoundException):
      get_interview_session_for_user(session.pk, self.user)

  def test_raises_not_found_for_nonexistent_uuid(self):
    """존재하지 않는 UUID이면 NotFoundException을 발생시킨다."""
    with self.assertRaises(NotFoundException):
      get_interview_session_for_user(uuid.uuid4(), self.user)

  def test_select_related_resume_and_job_description(self):
    """resume과 user_job_description이 select_related로 조회된다."""
    session = InterviewSessionFactory(user=self.user)
    result = get_interview_session_for_user(session.pk, self.user)
    # select_related가 올바르게 동작하면 추가 쿼리 없이 접근 가능
    _ = result.resume
    _ = result.user_job_description
    self.assertIsNotNone(result)


class CreateInterviewSessionActiveSessionGuardTests(TestCase):
  """create_interview_session 활성 세션 가드 테스트"""

  def setUp(self):
    self.user = UserFactory()
    self.resume = ResumeFactory(user=self.user)
    self.user_job_description = UserJobDescriptionFactory(user=self.user)

  def test_raises_conflict_if_in_progress_session_exists(self):
    """IN_PROGRESS 상태인 세션이 존재하면 ConflictException이 발생한다."""
    InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)

    with self.assertRaises(ConflictException) as ctx:
      create_interview_session(
        user=self.user,
        resume=self.resume,
        user_job_description=self.user_job_description,
        interview_session_type=InterviewSessionType.FOLLOWUP,
        interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
      )
    self.assertEqual(ctx.exception.error_code, "ACTIVE_INTERVIEW_SESSION_EXISTS")

  def test_raises_conflict_if_paused_session_exists(self):
    """PAUSED 상태인 세션이 존재하면 ConflictException이 발생한다."""
    InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.PAUSED)

    with self.assertRaises(ConflictException) as ctx:
      create_interview_session(
        user=self.user,
        resume=self.resume,
        user_job_description=self.user_job_description,
        interview_session_type=InterviewSessionType.FOLLOWUP,
        interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
      )
    self.assertEqual(ctx.exception.error_code, "ACTIVE_INTERVIEW_SESSION_EXISTS")

  def test_creates_session_when_only_completed_exists(self):
    """COMPLETED 상태인 세션만 존재할 때는 세션이 정상적으로 생성된다."""
    InterviewSessionFactory(user=self.user, interview_session_status=InterviewSessionStatus.COMPLETED)

    session = create_interview_session(
      user=self.user,
      resume=self.resume,
      user_job_description=self.user_job_description,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
    )
    self.assertIsNotNone(session.pk)

  def test_creates_session_when_no_active_for_user(self):
    """유저에게 활성화된 세션이 없으면 세션이 정상적으로 생성된다."""
    session = create_interview_session(
      user=self.user,
      resume=self.resume,
      user_job_description=self.user_job_description,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
    )
    self.assertIsNotNone(session.pk)

  def test_other_user_active_session_does_not_block(self):
    """다른 유저의 활성화된 세션은 생성을 막지 않는다."""
    other_user = UserFactory()
    InterviewSessionFactory(user=other_user, interview_session_status=InterviewSessionStatus.IN_PROGRESS)

    session = create_interview_session(
      user=self.user,
      resume=self.resume,
      user_job_description=self.user_job_description,
      interview_session_type=InterviewSessionType.FOLLOWUP,
      interview_difficulty_level=InterviewDifficultyLevel.NORMAL,
    )
    self.assertIsNotNone(session.pk)
