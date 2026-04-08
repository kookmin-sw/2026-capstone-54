from api.v1.interview.serializers import (
  InterviewSessionCreateSerializer,
  InterviewSessionSerializer,
  InterviewSessionUpdateSerializer,
)
from common.permissions import AllowAny
from common.views import BaseAPIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from interview.models import InterviewSession
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["면접 시뮬레이션"])
class InterviewSessionAPIView(BaseAPIView):
  permission_classes = [AllowAny]

  @extend_schema(
    summary="면접 세션 생성", request=InterviewSessionCreateSerializer, responses={201: InterviewSessionSerializer}
  )
  def post(self, request):
    serializer = InterviewSessionCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    session = serializer.save(started_at=timezone.now())
    return Response(InterviewSessionSerializer(session).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["면접 시뮬레이션"])
class InterviewSessionDetailAPIView(BaseAPIView):
  permission_classes = [AllowAny]

  @extend_schema(
    summary="면접 세션 토큰 합산 업데이트", request=InterviewSessionUpdateSerializer, responses={200: InterviewSessionSerializer}
  )
  def patch(self, request, session_id):
    session = get_object_or_404(InterviewSession, id=session_id)
    serializer = InterviewSessionUpdateSerializer(session, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    # 종료 시간 및 상태 자동 계산
    if session.status == InterviewSession.Status.IN_PROGRESS:
      session.finished_at = timezone.now()
      session.status = InterviewSession.Status.COMPLETED
      if session.started_at:
        session.duration_seconds = int((session.finished_at - session.started_at).total_seconds())
      session.save(update_fields=["finished_at", "status", "duration_seconds"])

    return Response(InterviewSessionSerializer(session).data)
