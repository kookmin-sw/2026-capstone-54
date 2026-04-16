"""티켓 현황 및 정책 조회 뷰."""

from api.v1.tickets.serializers import TicketPolicySerializer, UserTicketSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from tickets.services import GetOrCreateUserTicketService


@extend_schema(tags=["티켓"])
class UserTicketView(BaseAPIView):
  """사용자 티켓 현황 조회."""

  permission_classes = [IsEmailVerified]

  @extend_schema(
    summary="티켓 현황 조회",
    responses={200: UserTicketSerializer},
  )
  def get(self, request):
    """현재 사용자의 티켓 보유량을 조회한다."""
    user_ticket = GetOrCreateUserTicketService(user=self.current_user).perform()
    return Response(UserTicketSerializer(user_ticket).data)


@extend_schema(tags=["티켓"])
class TicketPolicyView(BaseAPIView):
  """티켓 정책 상수 조회 (비인증)."""

  permission_classes = []  # 비인증 허용

  @extend_schema(
    summary="티켓 정책 조회",
    description="티켓 소모량, 보상 정책 등 백엔드 상수를 반환한다.",
    responses={200: TicketPolicySerializer},
  )
  def get(self, request):
    """티켓 정책 상수를 반환한다."""
    return Response(TicketPolicySerializer({}).data)
