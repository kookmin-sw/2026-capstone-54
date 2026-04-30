"""SaveTranscriptResultTask 의 STT 결과 저장 + 자동 dispatch 동작 검증."""

from unittest.mock import patch

from django.test import TestCase
from interviews.enums import InterviewAnalysisReportStatus, TranscriptStatus
from interviews.factories import (
  InterviewAnalysisReportFactory,
  InterviewSessionFactory,
  InterviewTurnFactory,
)
from interviews.models import InterviewAnalysisReport, InterviewTurn
from interviews.tasks.save_transcript_result_task import SaveTranscriptResultTask


@patch("notifications.services.CreateNotificationService")
class SaveTranscriptResultTaskTests(TestCase):
  """SaveTranscriptResultTask 가 마지막 STT 완료 시 PENDING report 를 자동 dispatch 하는지 검증."""

  def setUp(self):
    self.task = SaveTranscriptResultTask()
    self.session = InterviewSessionFactory()

  @patch("interviews.services.regenerate_analysis_report_service.dispatch_report_task")
  @patch("interviews.services.regenerate_analysis_report_service.get_resume_bundle_url", return_value="")
  def test_dispatches_report_when_last_pending_transcript_completes(self, _mock_url, mock_dispatch, _mock_notif):
    """마지막 PENDING turn 의 STT 가 완료되면 PENDING report 가 자동 dispatch 된다."""
    InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.COMPLETED,
      turn_number=1,
    )
    pending_turn = InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.PENDING,
      turn_number=2,
    )
    report = InterviewAnalysisReportFactory(
      interview_session=self.session,
      interview_analysis_report_status=InterviewAnalysisReportStatus.PENDING,
    )

    self.task.run(turn_id=pending_turn.pk, transcript_text="안녕하세요.")

    pending_turn.refresh_from_db()
    self.assertEqual(pending_turn.transcript_status, TranscriptStatus.COMPLETED)
    self.assertEqual(pending_turn.transcript_text, "안녕하세요.")
    mock_dispatch.assert_called_once()
    report.refresh_from_db()
    self.assertEqual(report.interview_analysis_report_status, InterviewAnalysisReportStatus.GENERATING)

  @patch("interviews.services.regenerate_analysis_report_service.dispatch_report_task")
  def test_does_not_dispatch_when_other_transcripts_still_pending(self, mock_dispatch, _mock_notif):
    """다른 turn 이 여전히 PENDING/PROCESSING 이면 dispatch 하지 않는다."""
    pending_turn_a = InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.PENDING,
      turn_number=1,
    )
    InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.PROCESSING,
      turn_number=2,
    )
    InterviewAnalysisReportFactory(
      interview_session=self.session,
      interview_analysis_report_status=InterviewAnalysisReportStatus.PENDING,
    )

    self.task.run(turn_id=pending_turn_a.pk, transcript_text="첫 답변.")

    mock_dispatch.assert_not_called()

  @patch("interviews.services.regenerate_analysis_report_service.dispatch_report_task")
  def test_does_not_dispatch_when_no_pending_report(self, mock_dispatch, _mock_notif):
    """PENDING report 가 없으면 자동 dispatch 호출되지 않는다."""
    pending_turn = InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.PENDING,
      turn_number=1,
    )

    self.task.run(turn_id=pending_turn.pk, transcript_text="답변.")

    mock_dispatch.assert_not_called()

  @patch("interviews.services.regenerate_analysis_report_service.dispatch_report_task")
  @patch("interviews.services.regenerate_analysis_report_service.get_resume_bundle_url", return_value="")
  def test_failed_transcript_still_triggers_dispatch_check(self, _mock_url, mock_dispatch, _mock_notif):
    """FAILED 도 terminal 상태이므로 마지막 turn 이 FAILED 가 되면 PENDING report 가 dispatch 된다."""
    InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.COMPLETED,
      turn_number=1,
    )
    pending_turn = InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.PENDING,
      turn_number=2,
    )
    InterviewAnalysisReportFactory(
      interview_session=self.session,
      interview_analysis_report_status=InterviewAnalysisReportStatus.PENDING,
    )

    self.task.run(turn_id=pending_turn.pk, transcript_text="", error_code="STTTimeout")

    pending_turn.refresh_from_db()
    self.assertEqual(pending_turn.transcript_status, TranscriptStatus.FAILED)
    mock_dispatch.assert_called_once()

  @patch("interviews.services.regenerate_analysis_report_service.dispatch_report_task")
  def test_skips_when_report_already_generating(self, mock_dispatch, _mock_notif):
    """이미 GENERATING 인 report 는 다시 dispatch 되지 않는다 (idempotent)."""
    InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.COMPLETED,
      turn_number=1,
    )
    pending_turn = InterviewTurnFactory(
      interview_session=self.session,
      transcript_status=TranscriptStatus.PENDING,
      turn_number=2,
    )
    InterviewAnalysisReportFactory(
      interview_session=self.session,
      interview_analysis_report_status=InterviewAnalysisReportStatus.GENERATING,
    )

    self.task.run(turn_id=pending_turn.pk, transcript_text="답변.")

    mock_dispatch.assert_not_called()

  def test_returns_turn_not_found_when_turn_missing(self, _mock_notif):
    """존재하지 않는 turn_id 는 turn_not_found 응답."""
    result = self.task.run(turn_id=99999999, transcript_text="x")

    self.assertEqual(result["status"], "turn_not_found")
    self.assertFalse(InterviewTurn.objects.filter(pk=99999999).exists())
    self.assertFalse(InterviewAnalysisReport.objects.exists())
