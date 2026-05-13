from django.urls import path

from .views import HealthCheckAPIView

urlpatterns = [
  path("", HealthCheckAPIView.as_view(), name="health-check"),
]
