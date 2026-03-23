from django.urls import path

from .views import (
  SignInAPIView,
  SignOutAPIView,
  SignUpAPIView,
)

urlpatterns = [
  path("sign-up", SignUpAPIView.as_view(), name="sign-up"),
  path("sign-in", SignInAPIView.as_view(), name="sign-in"),
  path("sign-out", SignOutAPIView.as_view(), name="sign-out"),
]
