from api.v1.webhooks.views.video_processing_webhook_view import video_processing_webhook
from django.urls import path

urlpatterns = [
  path("sns/video-processing/", video_processing_webhook, name="sns-video-processing"),
]
