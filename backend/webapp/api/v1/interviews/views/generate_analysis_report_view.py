"""리포트 생성 요청 뷰.

사용자가 면접 결과 화면에서 직접 리포트 생성을 요청할 때 호출된다.
이미 리포트가 있으면 기존 리포트를 재생성한다.
완료된 세션에 대한 일회성 trigger 라 owner-token 다중 접속 차단 대상이 아니다
(get_interview_session_for_user 가 user 검증 + status 검사로 충분).

STT (transcript) 가 진행 중인 경우 사용자에게 에러를 노출하지 않는다.
report 는 PENDING 으로 생성되어 사용자에게 즉시 반환되고,
analysis-stt 의 마지막 turn 콜백 (save_transcript_result_task) 에서
모든 STT 가 COMPLETED 인 것을 확인하면 자동으로 dispatch_report_if_ready 가 호출된다.
"""

from api.v1.interviews.serializers import InterviewAnalysisReportSerializer
from common.exceptions import ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from config.settings.base import TICKET_COST_ANALYSIS_REPORT
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewAnalysisReportStatus, InterviewSessionStatus
from interviews.models import InterviewAnalysisReport
from interviews.services import get_interview_session_for_user
from rest_framework import status
from rest_framework.response import Response
from tickets.services import UseTicketsService


@extend_schema(tags=["면접"])
class GenerateAnalysisReportView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="면접 분석 리포트 생성 요청")
  def post(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)

    if interview_session.interview_session_status == InterviewSessionStatus.IN_PROGRESS:
      raise ValidationException(detail="진행 중인 세션은 리포트를 생성할 수 없습니다.")
    if interview_session.interview_session_status == InterviewSessionStatus.PAUSED:
      raise ValidationException(detail="일시정지된 세션입니다. 재개 후 다시 시도하세요.")

    self._validate_and_use_tickets(interview_session)

    report, created = InterviewAnalysisReport.objects.get_or_create(interview_session=interview_session)
    report = (
      InterviewAnalysisReport.objects.select_related("interview_session__user_job_description__job_description", ).get(
        pk=report.pk
      )
    )

    from interviews.services.regenerate_analysis_report_service import (
      dispatch_report_if_ready,
      regenerate_analysis_report,
    )

    if not created:
      if (report.interview_analysis_report_status != InterviewAnalysisReportStatus.FAILED):
        raise ValidationException(detail="리포트가 이미 생성 중이거나 완료되었습니다.")
      regenerate_analysis_report(report)
    else:
      dispatch_report_if_ready(report)

    return Response(
      InterviewAnalysisReportSerializer(report).data,
      status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )

  def _validate_and_use_tickets(self, interview_session):
    ticket_cost = TICKET_COST_ANALYSIS_REPORT
    reason = f"면접 분석 리포트 생성 (세션: {interview_session.pk})"
    try:
      UseTicketsService(user=self.current_user, amount=ticket_cost, reason=reason).perform()
    except ValueError as e:
      raise ValidationException(str(e))
