from django.test import TestCase
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.factories import InterviewSessionFactory


class InterviewSessionMarkCompletedTests(TestCase):
  """InterviewSession.mark_completed 테스트"""

  def test_mark_completed_sets_status_to_completed(self):
    """mark_completed 호출 시 상태가 completed로 변경된다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    session.mark_completed()
    session.refresh_from_db()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.COMPLETED)

  def test_mark_completed_persists_to_db(self):
    """mark_completed는 DB에 저장된다."""
    session = InterviewSessionFactory()
    session.mark_completed()
    from interviews.models import InterviewSession
    updated = InterviewSession.objects.get(pk=session.pk)
    self.assertEqual(updated.interview_session_status, InterviewSessionStatus.COMPLETED)


class InterviewSessionStrTests(TestCase):
  """InterviewSession.__str__ 테스트"""

  def test_str_contains_pk(self):
    """__str__은 세션 PK를 포함한다."""
    session = InterviewSessionFactory()
    result = str(session)
    self.assertIn(str(session.pk), result)

  def test_str_contains_status_display(self):
    """__str__은 상태 표시 문자열을 포함한다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.IN_PROGRESS)
    result = str(session)
    self.assertIn("진행 중", result)

  def test_str_completed_status_display(self):
    """__str__은 completed 상태의 표시 문자열을 포함한다."""
    session = InterviewSessionFactory(interview_session_status=InterviewSessionStatus.COMPLETED)
    result = str(session)
    self.assertIn("완료", result)


class InterviewSessionDefaultValuesTests(TestCase):
  """InterviewSession 기본값 테스트"""

  def test_default_status_is_in_progress(self):
    """생성 시 기본 상태는 in_progress이다."""
    session = InterviewSessionFactory()
    self.assertEqual(session.interview_session_status, InterviewSessionStatus.IN_PROGRESS)

  def test_default_total_questions_is_zero(self):
    """생성 시 total_questions 기본값은 0이다."""
    session = InterviewSessionFactory(total_questions=0)
    self.assertEqual(session.total_questions, 0)

  def test_uuid_is_pk(self):
    """UUID가 PK로 사용된다."""
    session = InterviewSessionFactory()
    self.assertEqual(session.pk, session.uuid)

  def test_full_process_session_type(self):
    """full_process 타입 세션을 생성할 수 있다."""
    session = InterviewSessionFactory(interview_session_type=InterviewSessionType.FULL_PROCESS)
    self.assertEqual(session.interview_session_type, InterviewSessionType.FULL_PROCESS)
