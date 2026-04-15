"""티켓 API URL."""

from api.v1.tickets.views import TicketPolicyView, UserTicketView
from django.urls import path

urlpatterns = [
  path("me/", UserTicketView.as_view(), name="ticket-me"),
  path("policies/", TicketPolicyView.as_view(), name="ticket-policies"),
]
