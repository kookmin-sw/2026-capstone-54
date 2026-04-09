"""면접 분석 리포트 조회 뷰."""

from api.v1.interviews.serializers import InterviewAnalysisReportSerializer
from common.exceptions import NotFoundException
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.models import InterviewAnalysisReport
from interviews.services import get_interview_session_for_user
from rest_framework.response import Response


@extend_schema(tags=["면접"])
class InterviewAnalysisReportView(BaseAPIView):
  serializer_class = InterviewAnalysisReportSerializer

  @extend_schema(summary="면접 분석 리포트 조회")
  def get(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)

    try:
      report = interview_session.analysis_report
    except InterviewAnalysisReport.DoesNotExist:
      raise NotFoundException(detail="아직 분석 리포트가 생성되지 않았습니다.")

    return Response(InterviewAnalysisReportSerializer(report).data)
