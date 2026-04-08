from api.v1.interviews.consumers import InterviewAbandonmentConsumer
from django.urls import re_path

websocket_urlpatterns = [
  re_path(
    r"^ws/interviews/(?P<session_uuid>[0-9a-f-]+)/$",
    InterviewAbandonmentConsumer.as_asgi(),
  ),
]
