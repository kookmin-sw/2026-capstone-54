from django.urls import path

from .views import EmailNotificationSettingsAPIView

urlpatterns = [
  path(
    "",
    EmailNotificationSettingsAPIView.as_view(),
    name="email-notification-settings",
  ),
]
