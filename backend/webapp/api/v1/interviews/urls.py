from api.v1.interviews.views import (
  AbortRecordingView,
  CompleteRecordingView,
  FinishInterviewView,
  GenerateAnalysisReportView,
  InitiateRecordingView,
  InterviewAnalysisReportView,
  InterviewSessionViewSet,
  InterviewTurnListView,
  PlaybackUrlView,
  RecordingListView,
  StartInterviewView,
  SubmitAnswerView,
)
from django.urls import include, path
from rest_framework.routers import DefaultRouter

router = DefaultRouter(trailing_slash=True)
router.register("interview-sessions", InterviewSessionViewSet, basename="interview-session")

urlpatterns = [
  path("", include(router.urls)),
  # 면접 진행
  path(
    "interview-sessions/<uuid:interview_session_uuid>/start/",
    StartInterviewView.as_view(),
    name="interview-start",
  ),
  path(
    "interview-sessions/<uuid:interview_session_uuid>/turns/",
    InterviewTurnListView.as_view(),
    name="interview-turn-list",
  ),
  path(
    "interview-sessions/<uuid:interview_session_uuid>/turns/<int:turn_pk>/answer/",
    SubmitAnswerView.as_view(),
    name="interview-answer",
  ),
  path(
    "interview-sessions/<uuid:interview_session_uuid>/finish/",
    FinishInterviewView.as_view(),
    name="interview-finish",
  ),
  # 녹화
  path(
    "interview-sessions/<uuid:uuid>/recordings/initiate/",
    InitiateRecordingView.as_view(),
    name="recording-initiate",
  ),
  path(
    "interview-sessions/<uuid:uuid>/recordings/",
    RecordingListView.as_view(),
    name="recording-list",
  ),
  path(
    "recordings/<uuid:uuid>/complete/",
    CompleteRecordingView.as_view(),
    name="recording-complete",
  ),
  path(
    "recordings/<uuid:uuid>/abort/",
    AbortRecordingView.as_view(),
    name="recording-abort",
  ),
  path(
    "recordings/<uuid:uuid>/playback-url/",
    PlaybackUrlView.as_view(),
    name="recording-playback-url",
  ),
  # 리포트
  path(
    "interview-sessions/<uuid:interview_session_uuid>/analysis-report/",
    InterviewAnalysisReportView.as_view(),
    name="interview-report",
  ),
  path(
    "interview-sessions/<uuid:interview_session_uuid>/generate-report/",
    GenerateAnalysisReportView.as_view(),
    name="interview-generate-report",
  ),
]
