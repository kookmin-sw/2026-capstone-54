"""면접 종료 뷰."""

from api.v1.interviews.serializers import InterviewSessionSerializer
from common.exceptions import ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewSessionStatus
from interviews.services import get_interview_session_for_user
from rest_framework.response import Response


@extend_schema(tags=["면접"])
class FinishInterviewView(BaseAPIView):
  permission_classes = [IsEmailVerified]
  serializer_class = InterviewSessionSerializer

  @extend_schema(summary="면접 종료")
  def post(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)

    if interview_session.session_status != InterviewSessionStatus.IN_PROGRESS:
      raise ValidationException(detail="진행 중인 세션만 종료할 수 있습니다.")

    interview_session.mark_completed()

    # 분석 리포트 비동기 생성 태스크 발행 (구현 후 연결)
    # from interviews.tasks import generate_analysis_report_task
    # generate_analysis_report_task.delay(str(interview_session.pk))

    return Response(InterviewSessionSerializer(interview_session).data)
