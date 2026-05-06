"""리포트 생성 가드 단위 테스트."""

from unittest.mock import patch

from django.test import TestCase
from interviews.enums import InterviewAnalysisReportStatus
from interviews.factories import (
  InterviewAnalysisReportFactory,
  InterviewRecordingFactory,
  InterviewSessionFactory,
)
from interviews.services.regenerate_analysis_report_service import (
  dispatch_report_if_ready,
  face_analysis_pending,
)


class TestFaceAnalysisPending(TestCase):
  """face_analysis_pending 함수의 동작을 검증한다."""

  def test_detects_empty_dict_recording(self):
    """face_analysis_result가 빈 dict인 recording이 있으면 True를 반환한다."""
    session = InterviewSessionFactory()
    InterviewRecordingFactory(
      interview_session=session,
      face_analysis_result={},
    )

    self.assertTrue(face_analysis_pending(session))

  def test_returns_false_when_all_filled(self):
    """모든 recording의 face_analysis_result가 채워져 있으면 False를 반환한다."""
    session = InterviewSessionFactory()
    InterviewRecordingFactory(
      interview_session=session,
      face_analysis_result={"statistics": {"dominant_expression": "neutral"}},
    )

    self.assertFalse(face_analysis_pending(session))

  def test_detects_mixed_recordings(self):
    """일부만 빈 dict인 경우에도 True를 반환한다."""
    session = InterviewSessionFactory()
    InterviewRecordingFactory(
      interview_session=session,
      face_analysis_result={"statistics": {"dominant_expression": "neutral"}},
    )
    InterviewRecordingFactory(
      interview_session=session,
      face_analysis_result={},
    )

    self.assertTrue(face_analysis_pending(session))


class TestDispatchReportIfReady(TestCase):
  """dispatch_report_if_ready 함수의 face_analysis 가드를 검증한다."""

  @patch("interviews.services.regenerate_analysis_report_service.transcripts_pending", return_value=False)
  def test_returns_false_when_face_analysis_pending(self, mock_transcripts):
    """face_analysis 미완료 시 False를 반환한다."""
    report = InterviewAnalysisReportFactory(
      interview_analysis_report_status=InterviewAnalysisReportStatus.PENDING,
    )
    InterviewRecordingFactory(
      interview_session=report.interview_session,
      face_analysis_result={},
    )

    result = dispatch_report_if_ready(report)

    self.assertFalse(result)

  @patch("interviews.services.regenerate_analysis_report_service.dispatch_report_task")
  @patch("interviews.services.regenerate_analysis_report_service.get_resume_bundle_url", return_value="")
  @patch("interviews.services.regenerate_analysis_report_service.transcripts_pending", return_value=False)
  def test_dispatches_when_all_complete(self, mock_transcripts, mock_bundle, mock_dispatch):
    """face_analysis + transcripts 모두 완료 시 디스패치한다."""
    report = InterviewAnalysisReportFactory(
      interview_analysis_report_status=InterviewAnalysisReportStatus.PENDING,
    )
    InterviewRecordingFactory(
      interview_session=report.interview_session,
      face_analysis_result={"statistics": {"dominant_expression": "neutral"}},
    )

    result = dispatch_report_if_ready(report)

    self.assertTrue(result)
    mock_dispatch.assert_called_once()
