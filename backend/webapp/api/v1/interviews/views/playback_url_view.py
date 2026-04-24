from api.v1.interviews.serializers import PlaybackUrlResponseSerializer
from botocore.exceptions import BotoCoreError, ClientError
from common.exceptions import (
  ConflictException,
  PermissionDeniedException,
  ServiceUnavailableException,
)
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording
from interviews.services import GeneratePlaybackUrlService
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from subscriptions.enums import PlanType
from subscriptions.services import (
  GetCurrentSubscriptionService,
  PlanFeaturePolicyService,
)


@extend_schema(tags=["면접 녹화"])
class PlaybackUrlView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="녹화 재생 URL 조회")
  def get(self, request, uuid):
    recording = get_object_or_404(InterviewRecording, pk=uuid)

    if recording.status == RecordingStatus.ABANDONED:
      raise ConflictException("중단된 녹화는 재생할 수 없습니다.")

    subscription = GetCurrentSubscriptionService(user=self.current_user).perform()
    plan_type = subscription.plan_type if subscription else PlanType.FREE
    if not PlanFeaturePolicyService.can_use_feature(
      plan_type,
      PlanFeaturePolicyService.FEATURE_REPORT_RECORDING_PLAYBACK,
    ):
      raise PermissionDeniedException("녹화 영상 조회는 PRO 요금제에서만 사용 가능합니다.")

    try:
      result = GeneratePlaybackUrlService(
        recording=recording,
        user=self.current_user,
      ).perform()
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response(PlaybackUrlResponseSerializer(result).data)
