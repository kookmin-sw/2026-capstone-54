from django.urls import path

from .views import StreakLogsAPIView, StreakStatisticsAPIView

urlpatterns = [
  path("logs/", StreakLogsAPIView.as_view(), name="streak-logs"),
  path("statistics/", StreakStatisticsAPIView.as_view(), name="streak-statistics"),
]
