from api.v1.interview.serializers import InterviewExchangeCreateSerializer, InterviewExchangeSerializer
from common.permissions import AllowAny
from common.views import BaseAPIView
from django.db.models import Avg
from django.db.models.functions import Length
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

    # 세션 통계 자동 갱신
    session = exchange.session
    exchanges = session.exchanges.all()
    session.total_initial_questions = exchanges.filter(exchange_type="initial").count()
    session.total_followup_questions = exchanges.filter(exchange_type="followup").count()
    avg_len = exchanges.annotate(answer_len=Length("answer")).aggregate(avg=Avg("answer_len"))["avg"]
    session.avg_answer_length = int(avg_len) if avg_len else 0
    session.save(update_fields=["total_initial_questions", "total_followup_questions", "avg_answer_length"])

    return Response(InterviewExchangeSerializer(exchange).data, status=status.HTTP_201_CREATED)
