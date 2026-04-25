from api.v1.interviews.serializers import RecordingListSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording
from rest_framework.response import Response


@extend_schema(tags=["면접 녹화"])
class RecordingListView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="녹화 목록 조회")
  def get(self, request, uuid):
    recordings = InterviewRecording.objects.filter(
      interview_session__uuid=uuid,
      user=self.current_user,
    ).exclude(status=RecordingStatus.ABANDONED)

    return Response(RecordingListSerializer(recordings, many=True).data)
