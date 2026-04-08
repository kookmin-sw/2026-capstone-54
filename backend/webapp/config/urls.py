"""
URL configuration for backend project.
"""

from common.views.flower_proxy import flower_proxy
from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.decorators.csrf import csrf_exempt
from django.views.static import serve
from drf_spectacular.views import (
  SpectacularAPIView,
  SpectacularRedocView,
  SpectacularSwaggerView,
)

urlpatterns = [
  path('admin/flower/', csrf_exempt(admin.site.admin_view(flower_proxy)), {'path': ''}),
  path('admin/flower/<path:path>', csrf_exempt(admin.site.admin_view(flower_proxy))),
  path('admin/', admin.site.urls),
  path("", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
  path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
  path("schema/", SpectacularAPIView.as_view(), name="schema"),
  path("api/", include("api.urls")),
  path("markdownx/", include("markdownx.urls")),
  path("realtime-docs/", include("realtime_docs.urls")),
]

if settings.DEBUG:
  urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
    re_path(r"^static/(?P<path>.*)$", serve, {"document_root": settings.STATIC_ROOT}),
  ]
