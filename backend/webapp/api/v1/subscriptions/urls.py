from django.urls import path

from .views import SubscriptionMeView

urlpatterns = [
  path(
    "subscriptions/me/",
    SubscriptionMeView.as_view(),
    name="subscription-me",
  ),
]
