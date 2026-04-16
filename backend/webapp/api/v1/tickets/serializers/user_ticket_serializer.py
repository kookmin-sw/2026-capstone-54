"""사용자 티켓 시리얼라이저."""

from rest_framework import serializers
from tickets.models import UserTicket


class UserTicketSerializer(serializers.ModelSerializer):
  """사용자 티켓 현황 조회용 시리얼라이저."""

  total_count = serializers.IntegerField(read_only=True)

  class Meta:
    model = UserTicket
    fields = (
      "daily_count",
      "purchased_count",
      "total_count",
    )
    read_only_fields = fields
