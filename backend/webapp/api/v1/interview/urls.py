from api.v1.interview.views import InterviewExchangeAPIView, InterviewSessionAPIView, InterviewSessionDetailAPIView
from django.urls import path

urlpatterns = [
  path("sessions/", InterviewSessionAPIView.as_view(), name="interview-session-create"),
  path("sessions/<int:session_id>/", InterviewSessionDetailAPIView.as_view(), name="interview-session-detail"),
  path("exchanges/", InterviewExchangeAPIView.as_view(), name="interview-exchange-create"),
]
