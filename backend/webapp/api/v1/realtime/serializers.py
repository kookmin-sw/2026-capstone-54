from rest_framework import serializers


class WsTicketResponseSerializer(serializers.Serializer):
  """WebSocket 단기 티켓 발급 응답."""

  ticket = serializers.CharField(help_text="WebSocket 연결에 사용할 1회용 단기 티켓 (60초 유효)")
