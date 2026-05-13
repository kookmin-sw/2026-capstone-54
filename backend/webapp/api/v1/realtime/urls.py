from django.urls import path

from .views import WsTicketAPIView

urlpatterns = [
  path("ws-ticket/", WsTicketAPIView.as_view(), name="ws-ticket"),
]
