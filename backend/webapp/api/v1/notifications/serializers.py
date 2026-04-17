from notifications.models import Notification
from rest_framework import serializers


class NotificationSerializer(serializers.ModelSerializer):
  """알림 응답 직렬화."""

  notifiable_type_label = serializers.SerializerMethodField()

  class Meta:
    model = Notification
    fields = [
      "id",
      "message",
      "category",
      "is_read",
      "notifiable_type_label",
      "notifiable_id",
      "created_at",
    ]
    read_only_fields = [
      "id",
      "message",
      "category",
      "notifiable_type_label",
      "notifiable_id",
      "created_at",
    ]

  def get_notifiable_type_label(self, obj) -> str | None:
    if obj.notifiable_type:
      return f"{obj.notifiable_type.app_label}.{obj.notifiable_type.model}"
    return None
