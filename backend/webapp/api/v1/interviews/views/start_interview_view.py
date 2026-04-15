"""면접 초기 질문 생성 뷰."""

from api.v1.interviews.serializers import InterviewTurnSerializer
from common.exceptions import PermissionDeniedException, ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.constants import TICKET_COST_FOLLOWUP, TICKET_COST_FULL_PROCESS
from interviews.enums import InterviewSessionType
from interviews.services import (
  GenerateInitialQuestionsService,
  get_interview_session_for_user,
)
from rest_framework import status
from rest_framework.response import Response
from subscriptions.enums import PlanType
from tickets.services import GetOrCreateUserTicketService, UseTicketsService


@extend_schema(tags=["면접"])
class StartInterviewView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="면접 시작 — 초기 질문 생성")
  def post(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)

    ticket_cost = self._get_ticket_cost(interview_session)
    self._validate_and_use_tickets(interview_session, ticket_cost)

    interview_turns = GenerateInitialQuestionsService(interview_session=interview_session).perform()

    return Response(
      InterviewTurnSerializer(interview_turns, many=True).data,
      status=status.HTTP_201_CREATED,
    )

  def _get_ticket_cost(self, interview_session):
    if interview_session.interview_session_type == InterviewSessionType.FOLLOWUP:
      return TICKET_COST_FOLLOWUP
    elif (interview_session.interview_session_type == InterviewSessionType.FULL_PROCESS):
      return TICKET_COST_FULL_PROCESS
    raise ValidationException("알 수 없는 면접 타입입니다.")

  def _validate_and_use_tickets(self, interview_session, ticket_cost):
    if (interview_session.interview_session_type == InterviewSessionType.FULL_PROCESS):
      self._validate_pro_plan()

    user_ticket = GetOrCreateUserTicketService(user=self.current_user).perform()
    if user_ticket.total_count < ticket_cost:
      raise ValidationException(f"티켓이 부족합니다. (보유: {user_ticket.total_count}, 필요: {ticket_cost})")

    reason = f"{interview_session.interview_session_type} 면접 시작"
    UseTicketsService(user=self.current_user, amount=ticket_cost, reason=reason).perform()

  def _validate_pro_plan(self):
    subscription = getattr(self.current_user, "subscription", None)
    if not subscription or subscription.plan_type != PlanType.PRO:
      raise PermissionDeniedException("전체 프로세스 면접은 PRO 요금제에서만 사용 가능합니다.")
