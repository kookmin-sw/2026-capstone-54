from django.urls import path

from .views import (
  SignInAPIView,
)

urlpatterns = [
  path("sign-in", SignInAPIView.as_view(), name="sign-in"),
]
