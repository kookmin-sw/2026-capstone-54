# Feature: interview-analysis-report, Property 11: 리포트 생성 API 응답 코드
"""
Property 11: 리포트 생성 API 응답 코드

For any valid report generation request (completed session with exchanges),
the POST endpoint should return HTTP 202 with a response containing
report_id and status="generating".

**Validates: Requirements 8.3**
"""

from unittest.mock import patch

from django.urls import reverse
from django.utils import timezone
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from interview.models import AnalysisReport, InterviewExchange, InterviewSession
from rest_framework import status
from rest_framework.test import APIClient

exchange_count_strategy = st.integers(min_value=1, max_value=5)
difficulty_strategy = st.sampled_from(["friendly", "normal", "pressure"])


class ReportAPIResponseCodePropertyTests(TestCase):
  """Property 11: 리포트 생성 API 응답 코드 테스트"""

  def setUp(self):
    self.client = APIClient()

  @given(
    num_exchanges=exchange_count_strategy,
    difficulty=difficulty_strategy,
  )
  @settings(max_examples=100, deadline=None)
  def test_valid_request_returns_202_with_report_id_and_status(self, num_exchanges, difficulty):
    """완료된 세션 + Exchange가 있는 유효한 요청은 HTTP 202와
        report_id, status="generating"을 반환해야 한다.

        **Validates: Requirements 8.3**
        """
    session = InterviewSession.objects.create(
      model_name="gpt-4o-mini",
      difficulty_level=difficulty,
      status=InterviewSession.Status.COMPLETED,
      started_at=timezone.now(),
      duration_seconds=300,
    )
    for i in range(num_exchanges):
      InterviewExchange.objects.create(
        session=session,
        exchange_type="initial",
        depth=0,
        question=f"질문 {i + 1}",
        answer=f"답변 {i + 1}",
      )

    url = reverse("interview-report", kwargs={"session_id": session.id})

    with patch("celery.current_app.send_task") as mock_send_task:
      response = self.client.post(url, format="json")

      # Celery send_task가 호출되었는지 확인
      mock_send_task.assert_called_once()
      call_args = mock_send_task.call_args
      self.assertEqual(
        call_args[0][0],
        "analysis.tasks.generate_report.generate_analysis_report",
      )
      self.assertEqual(call_args[1]["queue"], "analysis")

    self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
    self.assertIn("report_id", response.data)
    self.assertEqual(response.data["status"], "generating")

    # report_id가 실제 DB에 존재하는지 확인
    report = AnalysisReport.objects.get(id=response.data["report_id"])
    self.assertEqual(report.status, AnalysisReport.Status.GENERATING)
    self.assertEqual(report.session_id, session.id)

    # cleanup
    AnalysisReport.objects.filter(session=session).delete()
    InterviewExchange.objects.filter(session=session).delete()
    session.delete()
