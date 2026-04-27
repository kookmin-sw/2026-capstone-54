"""리포트 생성 요청 뷰.

사용자가 면접 결과 화면에서 직접 리포트 생성을 요청할 때 호출된다.
이미 리포트가 있으면 기존 리포트를 재생성한다.
"""

from api.v1.interviews.serializers import InterviewAnalysisReportSerializer
from api.v1.interviews.views._owner_validation import require_session_owner_from_request
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
from tickets.services import UseTicketsService


@extend_schema(tags=["면접"])
class GenerateAnalysisReportView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="면접 분석 리포트 생성 요청")
  def post(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)
    require_session_owner_from_request(request, interview_session)

    if interview_session.interview_session_status == InterviewSessionStatus.IN_PROGRESS:
      raise ValidationException(detail="진행 중인 세션은 리포트를 생성할 수 없습니다.")
    if interview_session.interview_session_status == InterviewSessionStatus.PAUSED:
      raise ValidationException(detail="일시정지된 세션입니다. 재개 후 다시 시도하세요.")

    self._validate_and_use_tickets(interview_session)

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
      from interviews.services.regenerate_analysis_report_service import (
        dispatch_report_task,
        get_resume_bundle_url,
      )

      bundle_url = get_resume_bundle_url(interview_session)
      dispatch_report_task(report, bundle_url=bundle_url)

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
