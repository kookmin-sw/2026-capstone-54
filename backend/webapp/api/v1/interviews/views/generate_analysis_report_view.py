"""리포트 생성 요청 뷰.

사용자가 면접 결과 화면에서 직접 리포트 생성을 요청할 때 호출된다.
이미 리포트가 있으면 기존 리포트를 재생성한다.
"""

from api.v1.interviews.serializers import InterviewAnalysisReportSerializer
from celery import current_app
from common.exceptions import ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from config.settings.base import TICKET_COST_ANALYSIS_REPORT
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewSessionStatus
from interviews.models import InterviewAnalysisReport
from interviews.services import get_interview_session_for_user
from rest_framework import status
from rest_framework.response import Response
from tickets.services import GetOrCreateUserTicketService, UseTicketsService


@extend_schema(tags=["면접"])
class GenerateAnalysisReportView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="면접 분석 리포트 생성 요청")
  def post(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)

    if (interview_session.interview_session_status == InterviewSessionStatus.IN_PROGRESS):
      raise ValidationException(detail="진행 중인 세션은 리포트를 생성할 수 없습니다.")

    self._validate_and_use_tickets(interview_session)

    # 이미 리포트가 있으면 오류 상태일 때만 재생성, 없으면 신규 생성
    report, created = InterviewAnalysisReport.objects.get_or_create(interview_session=interview_session, )
    if not created:
      from interviews.enums import InterviewAnalysisReportStatus

      if (report.interview_analysis_report_status != InterviewAnalysisReportStatus.FAILED):
        raise ValidationException(detail="리포트가 이미 생성 중이거나 완료되었습니다.")
      from interviews.services.regenerate_analysis_report_service import (
        regenerate_analysis_report,
      )

      regenerate_analysis_report(report)
    else:
      current_app.send_task(
        "analysis.tasks.generate_report.generate_analysis_report",
        args=[report.pk],
        queue="analysis",
      )

    return Response(
      InterviewAnalysisReportSerializer(report).data,
      status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )

  def _validate_and_use_tickets(self, interview_session):
    ticket_cost = TICKET_COST_ANALYSIS_REPORT
    user_ticket = GetOrCreateUserTicketService(user=self.current_user).perform()
    if user_ticket.total_count < ticket_cost:
      raise ValidationException(f"티켓이 부족합니다. (보유: {user_ticket.total_count}, 필요: {ticket_cost})")

    reason = f"면접 분석 리포트 생성 (세션: {interview_session.pk})"
    UseTicketsService(user=self.current_user, amount=ticket_cost, reason=reason).perform()
