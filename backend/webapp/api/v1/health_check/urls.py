from django.urls import path

from .views import HealthCheckAPIView

urlpatterns = [
  path("health-check/", HealthCheckAPIView.as_view(), name="health-check"),
]
