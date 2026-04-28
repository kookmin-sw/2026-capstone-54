"""면접 초기 질문 생성 뷰."""

import secrets

from api.v1.interviews.serializers import InterviewTurnSerializer
from common.exceptions import PermissionDeniedException, ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from interviews.constants import TICKET_COST_FOLLOWUP, TICKET_COST_FULL_PROCESS
from interviews.enums import InterviewSessionType
from interviews.services import (
  ClaimSessionOwnershipService,
  GenerateInitialQuestionsService,
  get_interview_session_for_user,
)
from rest_framework import status
from rest_framework.response import Response
from subscriptions.enums import PlanType
from subscriptions.services import (
  GetCurrentSubscriptionService,
  PlanFeaturePolicyService,
)
from tickets.services import UseTicketsService

WS_TICKET_TTL_SECONDS = 60


@extend_schema(tags=["면접"])
class StartInterviewView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="면접 시작 — 초기 질문 생성")
  def post(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)

    if interview_session.total_questions > 0:
      raise ValidationException(
        detail="이미 시작된 면접입니다. 이어서 진행하세요.",
        error_code="INTERVIEW_ALREADY_STARTED",
      )

    ticket_cost = self._get_ticket_cost(interview_session)
    self._validate_and_use_tickets(interview_session, ticket_cost)

    interview_turns = GenerateInitialQuestionsService(interview_session=interview_session).perform()

    ownership = ClaimSessionOwnershipService(
      user=self.current_user,
      session=interview_session,
    ).perform()
    ws_ticket = secrets.token_urlsafe(32)
    cache.set(f"ws_ticket:{ws_ticket}", self.current_user.pk, timeout=WS_TICKET_TTL_SECONDS)

    return Response(
      {
        "turns": InterviewTurnSerializer(interview_turns, many=True).data,
        "owner_token": ownership["owner_token"],
        "owner_version": ownership["owner_version"],
        "ws_ticket": ws_ticket,
      },
      status=status.HTTP_201_CREATED,
    )

  def _get_ticket_cost(self, interview_session):
    if interview_session.interview_session_type == InterviewSessionType.FOLLOWUP:
      return TICKET_COST_FOLLOWUP
    elif (interview_session.interview_session_type == InterviewSessionType.FULL_PROCESS):
      return TICKET_COST_FULL_PROCESS
    raise ValidationException(detail="알 수 없는 면접 타입입니다.", error_code="UNKNOWN_INTERVIEW_TYPE")

  def _validate_and_use_tickets(self, interview_session, ticket_cost):
    subscription = GetCurrentSubscriptionService(user=self.current_user).perform()
    plan_type = subscription.plan_type if subscription else PlanType.FREE

    if (interview_session.interview_session_type == InterviewSessionType.FULL_PROCESS):
      self._validate_full_process_plan(plan_type)

    if interview_session.interview_practice_mode == "real":
      self._validate_real_mode_plan(plan_type)

    reason = f"{interview_session.interview_session_type} 면접 시작"
    try:
      UseTicketsService(user=self.current_user, amount=ticket_cost, reason=reason).perform()
    except ValueError as e:
      raise ValidationException(detail=str(e), error_code="INSUFFICIENT_TICKETS") from e

  def _validate_full_process_plan(self, plan_type: str):
    if not PlanFeaturePolicyService.can_use_feature(
      plan_type,
      PlanFeaturePolicyService.FEATURE_FULL_PROCESS_INTERVIEW,
    ):
      raise PermissionDeniedException("전체 프로세스 면접은 PRO 요금제에서만 사용 가능합니다.")

  def _validate_real_mode_plan(self, plan_type: str):
    if not PlanFeaturePolicyService.can_use_feature(
      plan_type,
      PlanFeaturePolicyService.FEATURE_REAL_MODE_INTERVIEW,
    ):
      raise PermissionDeniedException("실전 모드는 PRO 요금제에서만 사용 가능합니다.")
