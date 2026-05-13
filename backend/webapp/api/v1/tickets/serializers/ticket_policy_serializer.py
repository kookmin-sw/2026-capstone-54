"""티켓 정책 상수 시리얼라이저."""

from config.settings.base import (
  FREE_DAILY_TICKET_AMOUNT,
  MAX_REWARDED_INTERVIEWS_PER_DAY,
  PRO_DAILY_TICKET_AMOUNT,
  TICKET_COST_ANALYSIS_REPORT,
  TICKET_COST_FOLLOWUP_INTERVIEW,
  TICKET_COST_FULL_PROCESS_INTERVIEW,
  TICKET_REWARD_PER_INTERVIEW_ORDER,
)
from rest_framework import serializers


class TicketRewardPolicySerializer(serializers.Serializer):
  """면접 순서별 보상 정책."""

  interview_order = serializers.IntegerField()
  ticket_reward = serializers.IntegerField()


class TicketPolicySerializer(serializers.Serializer):
  """티켓 정책 상수 조회용 시리얼라이저."""

  free_daily_ticket_amount = serializers.IntegerField()
  pro_daily_ticket_amount = serializers.IntegerField()
  ticket_cost_followup_interview = serializers.IntegerField()
  ticket_cost_full_process_interview = serializers.IntegerField()
  ticket_cost_analysis_report = serializers.IntegerField()
  max_rewarded_interviews_per_day = serializers.IntegerField()
  ticket_reward_per_interview_order = TicketRewardPolicySerializer(many=True)

  def to_representation(self, instance):
    """상수를 직렬화한다."""
    reward_policies = [
      {
        "interview_order": order,
        "ticket_reward": TICKET_REWARD_PER_INTERVIEW_ORDER[order],
      } for order in range(1, MAX_REWARDED_INTERVIEWS_PER_DAY + 1)
    ]

    return {
      "free_daily_ticket_amount": FREE_DAILY_TICKET_AMOUNT,
      "pro_daily_ticket_amount": PRO_DAILY_TICKET_AMOUNT,
      "ticket_cost_followup_interview": TICKET_COST_FOLLOWUP_INTERVIEW,
      "ticket_cost_full_process_interview": TICKET_COST_FULL_PROCESS_INTERVIEW,
      "ticket_cost_analysis_report": TICKET_COST_ANALYSIS_REPORT,
      "max_rewarded_interviews_per_day": MAX_REWARDED_INTERVIEWS_PER_DAY,
      "ticket_reward_per_interview_order": reward_policies,
    }
