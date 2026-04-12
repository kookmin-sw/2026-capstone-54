"""면접 종료 뷰.

리포트 생성은 자동으로 하지 않는다.
사용자가 분석 > 면접 결과 화면에서 직접 리포트 생성을 요청해야 한다.
"""

from api.v1.interviews.serializers import InterviewSessionSerializer
from common.exceptions import ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewSessionStatus
from interviews.services import get_interview_session_for_user
from rest_framework.response import Response

# from streaks.services import RecordInterviewParticipationService


@extend_schema(tags=["면접"])
class FinishInterviewView(BaseAPIView):
  permission_classes = [IsEmailVerified]
  serializer_class = InterviewSessionSerializer

  @extend_schema(summary="면접 종료")
  def post(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)

    if interview_session.interview_session_status != InterviewSessionStatus.IN_PROGRESS:
      raise ValidationException(detail="진행 중인 세션만 종료할 수 있습니다.")

    interview_session.mark_completed()
    # RecordInterviewParticipationService(user=interview_session.user).perform()

    return Response(InterviewSessionSerializer(interview_session).data)
