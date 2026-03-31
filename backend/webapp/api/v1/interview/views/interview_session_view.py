from api.v1.interview.serializers import (
  InterviewSessionCreateSerializer,
  InterviewSessionSerializer,
  InterviewSessionUpdateSerializer,
)
from common.permissions import AllowAny
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interview.models import InterviewSession
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["면접 시뮬레이션"])
class InterviewSessionAPIView(BaseAPIView):
  permission_classes = [AllowAny]

  @extend_schema(summary="면접 세션 생성", request=InterviewSessionCreateSerializer, responses={201: InterviewSessionSerializer})
  def post(self, request):
    serializer = InterviewSessionCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    session = serializer.save()
    return Response(InterviewSessionSerializer(session).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=["면접 시뮬레이션"])
class InterviewSessionDetailAPIView(BaseAPIView):
  permission_classes = [AllowAny]

  @extend_schema(summary="면접 세션 토큰 합산 업데이트", request=InterviewSessionUpdateSerializer, responses={200: InterviewSessionSerializer})
  def patch(self, request, session_id):
    session = InterviewSession.objects.get(id=session_id)
    serializer = InterviewSessionUpdateSerializer(session, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(InterviewSessionSerializer(session).data)
