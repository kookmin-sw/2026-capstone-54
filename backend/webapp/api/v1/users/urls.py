from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
  ResendVerifyEmailAPIView,
  SignInAPIView,
  SignOutAPIView,
  SignUpAPIView,
  UnregisterAPIView,
  UserMeAPIView,
  VerifyEmailAPIView,
)

urlpatterns = [
  path("sign-up/", SignUpAPIView.as_view(), name="sign-up"),
  path("sign-in/", SignInAPIView.as_view(), name="sign-in"),
  path("sign-out/", SignOutAPIView.as_view(), name="sign-out"),
  path("me/", UserMeAPIView.as_view(), name="user-me"),
  path("verify-email/", VerifyEmailAPIView.as_view(), name="verify-email"),
  path("resend-verify-email/", ResendVerifyEmailAPIView.as_view(), name="resend-verify-email"),
  path("unregister/", UnregisterAPIView.as_view(), name="unregister"),
  path("tokens/verify/", TokenVerifyView.as_view(), name="token-verify"),
  path("tokens/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]
