from api.v1.interview.views import (
  InterviewAnswerAPIView,
  InterviewExchangeAPIView,
  InterviewFinishAPIView,
  InterviewGenerateQuestionsAPIView,
  InterviewSessionAPIView,
  InterviewSessionCreateAPIView,
  InterviewSessionDetailAPIView,
  ReportAPIView,
)
from django.urls import path

urlpatterns = [
  # 기존 저수준 CRUD API (하위 호환)
  path("sessions/", InterviewSessionAPIView.as_view(), name="interview-session-create"),
  path("sessions/<int:session_id>/", InterviewSessionDetailAPIView.as_view(), name="interview-session-detail"),
  path("exchanges/", InterviewExchangeAPIView.as_view(), name="interview-exchange-create"),
  # 면접 진행 흐름 API
  path("flow/sessions/", InterviewSessionCreateAPIView.as_view(), name="interview-flow-session-create"),
  path(
    "flow/sessions/<int:session_id>/questions/",
    InterviewGenerateQuestionsAPIView.as_view(),
    name="interview-flow-generate-questions"
  ),
  path("flow/<int:session_id>/answer/", InterviewAnswerAPIView.as_view(), name="interview-flow-answer"),
  path("flow/<int:session_id>/finish/", InterviewFinishAPIView.as_view(), name="interview-flow-finish"),
  # 면접 분석 리포트 API
  path("sessions/<int:session_id>/report/", ReportAPIView.as_view(), name="interview-report"),
]
