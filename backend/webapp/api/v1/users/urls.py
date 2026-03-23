from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
  SignInAPIView,
  SignOutAPIView,
  SignUpAPIView,
  UnregisterAPIView,
)

urlpatterns = [
  path("sign-up", SignUpAPIView.as_view(), name="sign-up"),
  path("sign-in", SignInAPIView.as_view(), name="sign-in"),
  path("sign-out", SignOutAPIView.as_view(), name="sign-out"),
  path("unregister", UnregisterAPIView.as_view(), name="unregister"),
  path("tokens/verify", TokenVerifyView.as_view(), name="token-verify"),
  path("tokens/refresh", TokenRefreshView.as_view(), name="token-refresh"),
]
