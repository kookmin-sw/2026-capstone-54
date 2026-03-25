"""
URL configuration for backend project.
"""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve
from drf_spectacular.views import (
  SpectacularAPIView,
  SpectacularRedocView,
  SpectacularSwaggerView,
)

urlpatterns = [
  path('admin/', admin.site.urls),
  path("", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
  path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
  path("schema/", SpectacularAPIView.as_view(), name="schema"),
  path("api/", include("api.urls")),
  path("realtime-docs/", include("realtime_docs.urls")),
]

if settings.DEBUG:
  from rest_framework.request import Request
  from rest_framework.views import APIView

  class DebugErrorView(APIView):
    """의도적으로 500 에러를 발생시켜 Slack 에러 알림을 테스트한다."""

    def get(self, request: Request):
      raise RuntimeError("디버그용 의도적 에러 — Slack 에러 알림 테스트")

  def debug_nplusone(request):
    from django.http import HttpResponse
    from users.models import EmailVerificationCode
    codes = list(EmailVerificationCode.objects.all())
    for code in codes:
      _ = code.user.email  # select_related 없이 접근 → N+1 발생
    return HttpResponse(f"N+1 테스트 완료 — {len(codes)}건 조회")

  urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    re_path(r"^static/(?P<path>.*)$", serve, {"document_root": settings.STATIC_ROOT}),
    path("debug/error/", DebugErrorView.as_view()),
    path("debug/nplusone/", debug_nplusone),
  ]
