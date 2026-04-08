from api.v1.interviews.views import (
  CreateInterviewSessionView,
  FinishInterviewView,
  InterviewAnalysisReportView,
  InterviewSessionDetailView,
  InterviewTurnListView,
  StartInterviewView,
  SubmitAnswerView,
)
from django.urls import path

urlpatterns = [
  # 세션
  path("interview-sessions/", CreateInterviewSessionView.as_view(), name="interview-session-create"),
  path(
    "interview-sessions/<uuid:interview_session_uuid>/",
    InterviewSessionDetailView.as_view(),
    name="interview-session-detail"
  ),
  # 면접 진행
  path("interview-sessions/<uuid:interview_session_uuid>/start/", StartInterviewView.as_view(), name="interview-start"),
  path(
    "interview-sessions/<uuid:interview_session_uuid>/turns/",
    InterviewTurnListView.as_view(),
    name="interview-turn-list"
  ),
  path(
    "interview-sessions/<uuid:interview_session_uuid>/turns/<int:turn_pk>/answer/",
    SubmitAnswerView.as_view(),
    name="interview-answer"
  ),
  path(
    "interview-sessions/<uuid:interview_session_uuid>/finish/", FinishInterviewView.as_view(), name="interview-finish"
  ),
  # 리포트
  path(
    "interview-sessions/<uuid:interview_session_uuid>/analysis-report/",
    InterviewAnalysisReportView.as_view(),
    name="interview-report"
  ),
]
