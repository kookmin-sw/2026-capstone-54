"""면접 세션 생성 뷰"""

from api.v1.interviews.serializers import CreateInterviewSessionSerializer, InterviewSessionSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.services import create_interview_session
from job_descriptions.models import UserJobDescription
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from resumes.models import Resume


@extend_schema(tags=["면접"])
class CreateInterviewSessionView(BaseAPIView):
  serializer_class = CreateInterviewSessionSerializer
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="면접 세션 생성")
  def post(self, request):
    serializer = CreateInterviewSessionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    resume = get_object_or_404(Resume, pk=data["resume_uuid"], user=self.current_user)

    user_job_description = get_object_or_404(
      UserJobDescription,
      pk=data["user_job_description_uuid"],
      user=self.current_user,
    )

    session = create_interview_session(
      user=self.current_user,
      resume=resume,
      user_job_description=user_job_description,
      interview_session_type=data["interview_session_type"],
      interview_difficulty_level=data["interview_difficulty_level"],
    )
    return Response(InterviewSessionSerializer(session).data, status=status.HTTP_201_CREATED)
