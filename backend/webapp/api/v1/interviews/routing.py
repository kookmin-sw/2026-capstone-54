from django.urls import path

from .consumers import InterviewReportStatusConsumer, InterviewSessionConsumer

# SSE — ASGI HTTP router 에서 직접 처리 (Django middleware 우회)
sse_urlpatterns = [
  path(
    "sse/interviews/<str:interview_session_uuid>/report-status/",
    InterviewReportStatusConsumer.as_asgi(),
  ),
]

# WebSocket
websocket_urlpatterns = [
  path("ws/interviews/<str:session_uuid>/", InterviewSessionConsumer.as_asgi()),
]
