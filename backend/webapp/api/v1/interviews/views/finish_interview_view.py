"""면접 종료 뷰."""

from api.v1.interviews.serializers import InterviewSessionSerializer
from celery import current_app
from common.exceptions import ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewSessionStatus
from interviews.models import InterviewAnalysisReport
from interviews.services import get_interview_session_for_user
from rest_framework.response import Response


@extend_schema(tags=["면접"])
class FinishInterviewView(BaseAPIView):
  permission_classes = [IsEmailVerified]
  serializer_class = InterviewSessionSerializer

  @extend_schema(summary="면접 종료")
  def post(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)

    if interview_session.interview_session_status != InterviewSessionStatus.IN_PROGRESS:
      raise ValidationException(detail="진행 중인 세션만 종료할 수 있습니다.")

    # 미답변 턴이 있으면 중도 종료, 없으면 정상 종료
    has_unanswered = interview_session.turns.filter(answer="").exists()
    if has_unanswered:
      interview_session.mark_abandoned()
    else:
      interview_session.mark_completed()

    # 분석 리포트 레코드 생성 후 Celery 태스크 발행
    report = InterviewAnalysisReport.objects.create(interview_session=interview_session)
    current_app.send_task(
      "analysis.tasks.generate_report.generate_analysis_report",
      args=[report.pk],
      queue="analysis",
    )

    return Response(InterviewSessionSerializer(interview_session).data)
