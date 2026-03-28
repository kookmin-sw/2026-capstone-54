from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import JobCategoryViewSet, JobListView, ProfileMeView

router = DefaultRouter()
router.register(r"job-categories", JobCategoryViewSet, basename="job-category")

urlpatterns = [
  path("", include(router.urls)),
  path(
    "job-categories/<int:job_category_id>/jobs/",
    JobListView.as_view(),
    name="job-list",
  ),
  path(
    "profiles/me/",
    ProfileMeView.as_view(),
    name="profile-me",
  ),
]
