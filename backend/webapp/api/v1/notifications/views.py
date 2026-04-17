"""알림 REST API ViewSet."""

from common.views import BaseGenericViewSet
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer
from notifications.models import Notification
from rest_framework import mixins, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import NotificationSerializer


@extend_schema(tags=["알림"])
class NotificationViewSet(
  mixins.ListModelMixin,
  mixins.DestroyModelMixin,
  BaseGenericViewSet,
):
  """알림 목록 조회 / 읽음 처리 / 삭제 ViewSet."""

  serializer_class = NotificationSerializer

  def get_queryset(self):
    return (
      Notification.objects.filter(user=self.current_user).select_related("notifiable_type").order_by("-created_at")
    )

  @extend_schema(summary="내 알림 목록 조회", responses={200: NotificationSerializer(many=True)})
  def list(self, request, *args, **kwargs):
    return super().list(request, *args, **kwargs)

  @extend_schema(summary="알림 단건 삭제", responses={204: None})
  def destroy(self, request, *args, **kwargs):
    return super().destroy(request, *args, **kwargs)

  @extend_schema(summary="알림 단건 읽음 처리", responses={200: NotificationSerializer})
  @action(detail=True, methods=["patch"], url_path="read")
  def read(self, request, pk=None):
    """단건 읽음 처리."""
    notification = self.get_object()
    notification.is_read = True
    notification.save(update_fields=["is_read", "updated_at"])
    return Response(NotificationSerializer(notification).data)

  @extend_schema(
    summary="전체 알림 읽음 처리",
    responses={200: inline_serializer(
      name="MarkAllReadResponse",
      fields={"updated": serializers.IntegerField()},
    )},
  )
  @action(detail=False, methods=["patch"], url_path="mark-all-read")
  def mark_all_read(self, request):
    """전체 읽음 처리."""
    updated = Notification.objects.filter(user=self.current_user, is_read=False).update(
      is_read=True,
      updated_at=timezone.now(),
    )
    return Response({"updated": updated})

  @extend_schema(
    summary="전체 알림 삭제",
    responses={
      200: inline_serializer(
        name="ClearNotificationsResponse",
        fields={"deleted": serializers.IntegerField()},
      )
    },
  )
  @action(detail=False, methods=["delete"], url_path="clear")
  def clear(self, request):
    """전체 삭제."""
    deleted, _ = Notification.objects.filter(user=self.current_user).delete()
    return Response({"deleted": deleted}, status=status.HTTP_200_OK)
