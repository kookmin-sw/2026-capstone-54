from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.contenttypes.models import ContentType

from ..models import Notification


class CreateNotificationService:
  """알림을 생성하고 해당 사용자의 WS에 실시간 push한다."""

  def __init__(self, *, user, message: str, category: str, notifiable=None):
    self.user = user
    self.message = message
    self.category = category
    self.notifiable = notifiable

  def perform(self) -> Notification:
    kwargs = dict(
      user=self.user,
      message=self.message,
      category=self.category,
    )
    if self.notifiable is not None:
      kwargs["notifiable_type"] = ContentType.objects.get_for_model(self.notifiable)
      kwargs["notifiable_id"] = str(self.notifiable.pk)

    notification = Notification.objects.create(**kwargs)
    self._push_ws(notification)
    return notification

  def _push_ws(self, notification: Notification) -> None:
    payload = {
      "id": notification.pk,
      "message": notification.message,
      "category": notification.category,
      "createdAt": notification.created_at.isoformat(),
      "notifiableType": (
        f"{notification.notifiable_type.app_label}.{notification.notifiable_type.model}"
        if notification.notifiable_type else None
      ),
      "notifiableId": notification.notifiable_id,
    }
    async_to_sync(get_channel_layer().group_send)(
      f"user_{self.user.pk}",
      {
        "type": "user.message",
        "payload": payload
      },
    )
