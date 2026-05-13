from django.urls import path

from .views import (
  UserJobDescriptionAPIView,
  UserJobDescriptionDetailAPIView,
  UserJobDescriptionStatsCountView,
)

urlpatterns = [
  path("", UserJobDescriptionAPIView.as_view(), name="user-job-descriptions"),
  path("stats/count/", UserJobDescriptionStatsCountView.as_view(), name="user-job-description-stats-count"),
  path("<uuid:uuid>/", UserJobDescriptionDetailAPIView.as_view(), name="user-job-description-detail"),
]
