from django.urls import path

from .views import UserJobDescriptionAPIView, UserJobDescriptionDetailAPIView

urlpatterns = [
  path("", UserJobDescriptionAPIView.as_view(), name="user-job-descriptions"),
  path("<uuid:uuid>/", UserJobDescriptionDetailAPIView.as_view(), name="user-job-description-detail"),
]
