from common.consumers.websocket import UserWebSocketConsumer


class NotificationConsumer(UserWebSocketConsumer):
  """사용자 알림 WebSocket consumer.

    외부에서 push 방법::

      from channels.layers import get_channel_layer
      from asgiref.sync import async_to_sync

      async_to_sync(get_channel_layer().group_send)(
        f"user_{user_id}",
        {"type": "user.message", "payload": {<notification data>}},
      )
    """

  pass  # UserWebSocketConsumer가 인증/그룹관리/메시지전달 모두 처리
