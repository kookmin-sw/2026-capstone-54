from api.v1.interviews.serializers import BehaviorAnalysisSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.models import InterviewBehaviorAnalysis
from interviews.services import get_interview_session_for_user
from rest_framework import generics


@extend_schema(tags=["면접"])
class BehaviorAnalysisListView(BaseAPIView, generics.ListAPIView):
  permission_classes = [IsEmailVerified]
  serializer_class = BehaviorAnalysisSerializer

  @extend_schema(summary="면접 세션 행동 분석 목록 조회")
  def get(self, request, *args, **kwargs):
    return self.list(request, *args, **kwargs)

  def get_queryset(self):
    session = get_interview_session_for_user(
      self.kwargs["interview_session_uuid"],
      self.current_user,
    )
    return (
      InterviewBehaviorAnalysis.objects.filter(
        interview_session=session
      ).select_related("interview_turn").order_by("interview_turn__turn_number")
    )
