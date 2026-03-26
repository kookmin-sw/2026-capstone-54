"""
URL configuration for backend project.
"""

from django.contrib import admin
from django.urls import include, path
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
