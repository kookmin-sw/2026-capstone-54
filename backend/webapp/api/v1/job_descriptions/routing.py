from django.urls import path

from .consumers import UserJobDescriptionScrapingStatusConsumer

sse_urlpatterns = [
  path(
    "sse/user-job-descriptions/<str:user_job_description_uuid>/collection-status/",
    UserJobDescriptionScrapingStatusConsumer.as_asgi(),
  ),
]
