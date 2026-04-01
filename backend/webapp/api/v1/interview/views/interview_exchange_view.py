from api.v1.interview.serializers import InterviewExchangeCreateSerializer, InterviewExchangeSerializer
from common.permissions import AllowAny
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["면접 시뮬레이션"])
class InterviewExchangeAPIView(BaseAPIView):
  permission_classes = [AllowAny]

  @extend_schema(
    summary="질문-답변 저장", request=InterviewExchangeCreateSerializer, responses={201: InterviewExchangeSerializer}
  )
  def post(self, request):
    serializer = InterviewExchangeCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    exchange = serializer.save()
    return Response(InterviewExchangeSerializer(exchange).data, status=status.HTTP_201_CREATED)
