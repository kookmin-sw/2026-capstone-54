from django.urls import path

from .consumers import ResumeAnalysisStatusConsumer

sse_urlpatterns = [
  path("sse/resumes/<str:resume_uuid>/analysis-status/", ResumeAnalysisStatusConsumer.as_asgi()),
]
