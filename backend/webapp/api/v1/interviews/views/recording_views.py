from api.v1.interviews.serializers import (
  CompleteRecordingSerializer,
  InitiateRecordingResponseSerializer,
  InitiateRecordingSerializer,
  PlaybackUrlResponseSerializer,
  RecordingListSerializer,
)
from botocore.exceptions import BotoCoreError, ClientError
from common.exceptions import (
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
)
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording, InterviewTurn
from interviews.services import (
  AbortRecordingService,
  CompleteRecordingService,
  GeneratePlaybackUrlService,
  InitiateRecordingService,
  get_interview_session_for_user,
)
from interviews.services.get_s3_client import get_video_s3_client
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response


@extend_schema(tags=["면접 녹화"])
class InitiateRecordingView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="녹화 시작 — 멀티파트 업로드 초기화")
  def post(self, request, uuid):
    serializer = InitiateRecordingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    interview_session = get_interview_session_for_user(uuid, self.current_user)

    try:
      interview_turn = InterviewTurn.objects.get(
        pk=serializer.validated_data["turn_id"],
        interview_session=interview_session,
      )
    except InterviewTurn.DoesNotExist:
      raise NotFoundException()

    try:
      result = InitiateRecordingService(
        interview_session=interview_session,
        interview_turn=interview_turn,
        user=self.current_user,
        media_type=serializer.validated_data["media_type"],
      ).perform()
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response(
      InitiateRecordingResponseSerializer(result).data,
      status=status.HTTP_201_CREATED,
    )


@extend_schema(tags=["면접 녹화"])
class CompleteRecordingView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="녹화 완료 — 멀티파트 업로드 완료")
  def post(self, request, uuid):
    serializer = CompleteRecordingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
      recording = InterviewRecording.objects.get(pk=uuid)
    except InterviewRecording.DoesNotExist:
      raise NotFoundException()

    data = serializer.validated_data

    try:
      CompleteRecordingService(
        recording=recording,
        parts=data["parts"],
        end_timestamp=data["end_timestamp"],
        duration_ms=data["duration_ms"],
        single_upload=data.get("single_upload", False),
        user=self.current_user,
      ).perform()
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response(
      {
        "recordingId": recording.pk,
        "status": recording.status
      },
      status=status.HTTP_200_OK,
    )


@extend_schema(tags=["면접 녹화"])
class AbortRecordingView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="녹화 중단")
  def post(self, request, uuid):
    try:
      recording = InterviewRecording.objects.get(pk=uuid)
    except InterviewRecording.DoesNotExist:
      raise NotFoundException()

    try:
      AbortRecordingService(recording=recording, user=self.current_user).perform()
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["면접 녹화"])
class UploadRecordingView(BaseAPIView):
  permission_classes = [IsEmailVerified]
  parser_classes = [MultiPartParser]

  @extend_schema(summary="녹화 파일 직접 업로드 (단일 파일)")
  def put(self, request, uuid):
    try:
      recording = InterviewRecording.objects.get(pk=uuid)
    except InterviewRecording.DoesNotExist:
      raise NotFoundException()

    if recording.user != self.current_user:
      from common.exceptions import PermissionDeniedException

      raise PermissionDeniedException("본인의 녹화만 업로드할 수 있습니다.")

    if recording.status not in (
      RecordingStatus.INITIATED,
      RecordingStatus.UPLOADING,
    ):
      raise ConflictException("업로드 가능한 상태가 아닙니다.")

    file = request.FILES.get("file")
    if not file:
      from common.exceptions import ValidationException

      raise ValidationException("file 필드가 필요합니다.")

    try:
      s3 = get_video_s3_client()
      s3.put_object(
        Bucket=recording.s3_bucket,
        Key=recording.s3_key,
        Body=file,
        ContentType=file.content_type or "video/webm",
      )
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response({"status": "uploaded"}, status=status.HTTP_200_OK)


@extend_schema(tags=["면접 녹화"])
class RecordingListView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="녹화 목록 조회")
  def get(self, request, uuid):
    recordings = InterviewRecording.objects.filter(
      interview_session__uuid=uuid,
      user=self.current_user,
    ).exclude(status=RecordingStatus.ABANDONED, )

    return Response(RecordingListSerializer(recordings, many=True).data)


@extend_schema(tags=["면접 녹화"])
class PlaybackUrlView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="녹화 재생 URL 조회")
  def get(self, request, uuid):
    try:
      recording = InterviewRecording.objects.get(pk=uuid)
    except InterviewRecording.DoesNotExist:
      raise NotFoundException()

    if recording.status == RecordingStatus.ABANDONED:
      raise ConflictException("중단된 녹화는 재생할 수 없습니다.")

    try:
      result = GeneratePlaybackUrlService(
        recording=recording,
        user=self.current_user,
      ).perform()
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response(PlaybackUrlResponseSerializer(result).data)
