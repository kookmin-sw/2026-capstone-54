from django.urls import path

from .views import DashboardStatisticsAPIView

urlpatterns = [
  path("statistics/", DashboardStatisticsAPIView.as_view(), name="dashboard-statistics"),
]
