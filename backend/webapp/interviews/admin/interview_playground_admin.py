"""
면접 플레이그라운드 어드민.

이력서 UUID와 UserJobDescription UUID를 지정하면
면접 세션 생성 → 초기 질문 생성 → 답변 제출(꼬리질문/전체 프로세스) →
면접 종료 → 분석 리포트 확인까지 전 과정을 HTTP API 기반으로 실행한다.

각 단계는 기존 /api/v1/interviews/ 엔드포인트를 그대로 호출하며,
어드민 유저를 force_authenticate 하여 권한 문제 없이 동작한다.
"""

import json

import structlog
from django.contrib import admin
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.urls import path, reverse
from interviews.enums import InterviewDifficultyLevel, InterviewSessionStatus, InterviewSessionType
from interviews.models import InterviewSession, InterviewTurn
from job_descriptions.models import UserJobDescription
from rest_framework.test import APIClient
from resumes.models import Resume
from unfold.admin import ModelAdmin
from unfold.decorators import action

logger = structlog.getLogger(__name__)


class InterviewPlaygroundProxy(InterviewSession):
  """면접 플레이그라운드 전용 proxy model."""

  class Meta:
    proxy = True
    verbose_name = "면접 플레이그라운드"
    verbose_name_plural = "면접 플레이그라운드"


@admin.register(InterviewPlaygroundProxy)
class InterviewPlaygroundAdmin(ModelAdmin):
  """면접 세션 생성부터 분석 리포트까지 전 과정을 테스트하는 어드민 페이지."""

  actions_list = ["interview_playground"]

  def has_add_permission(self, request):
    return False

  def has_change_permission(self, request, obj=None):
    return False

  def get_urls(self):
    urls = super().get_urls()
    custom = [
      path(
        "playground-api/create-session/",
        self.admin_site.admin_view(self._proxy_create_session),
        name="interviews_interviewplaygroundproxy_create_session",
      ),
      path(
        "playground-api/start/<uuid:session_uuid>/",
        self.admin_site.admin_view(self._proxy_start),
        name="interviews_interviewplaygroundproxy_start",
      ),
      path(
        "playground-api/answer/<uuid:session_uuid>/<int:turn_pk>/",
        self.admin_site.admin_view(self._proxy_answer),
        name="interviews_interviewplaygroundproxy_answer",
      ),
      path(
        "playground-api/finish/<uuid:session_uuid>/",
        self.admin_site.admin_view(self._proxy_finish),
        name="interviews_interviewplaygroundproxy_finish",
      ),
      path(
        "playground-api/report/<uuid:session_uuid>/",
        self.admin_site.admin_view(self._proxy_report),
        name="interviews_interviewplaygroundproxy_report",
      ),
      path(
        "playground-api/load/<uuid:session_uuid>/",
        self.admin_site.admin_view(self._proxy_load_session),
        name="interviews_interviewplaygroundproxy_load",
      ),
    ]
    return custom + urls

  @action(description="면접 플레이그라운드", url_path="interview-playground")
  def interview_playground(self, request: HttpRequest) -> HttpResponse:
    """어드민 유저의 이력서·채용공고 목록을 제공하고 플레이그라운드를 렌더링한다."""
    resume_qs = Resume.objects.filter(user=request.user, deleted_at__isnull=True).order_by("-created_at")
    resumes = [{"id": str(r.pk), "title": r.title} for r in resume_qs]

    ujd_qs = (
      UserJobDescription.objects.filter(user=request.user).select_related("job_description").order_by("-created_at")
    )
    ujds = [{"id": str(u.pk), "label": f"{u.job_description.company} — {u.job_description.title}"} for u in ujd_qs]

    session_qs = (
      InterviewSession.objects.filter(user=request.user, interview_session_status=InterviewSessionStatus.IN_PROGRESS
                                      ).order_by("-created_at")[:20]
    )

    def _session_label(s):
      date = s.created_at.strftime("%Y-%m-%d %H:%M")
      return f"{s.interview_session_type} / {s.interview_difficulty_level} — {date}"

    in_progress_sessions = [{"uuid": str(s.pk), "label": _session_label(s)} for s in session_qs]

    changelist_url = reverse("admin:interviews_interviewplaygroundproxy_changelist")
    context = {
      "title": "면접 플레이그라운드",
      "resumes": json.dumps(resumes),
      "ujds": json.dumps(ujds),
      "in_progress_sessions": json.dumps(in_progress_sessions),
      "session_types": InterviewSessionType.choices,
      "difficulty_levels": InterviewDifficultyLevel.choices,
      "playground_api_base": changelist_url + "playground-api/",
      **self.admin_site.each_context(request),
    }
    return render(request, "admin/interviews/interview_playground.html", context)

  def has_interview_playground_permission(self, request: HttpRequest) -> bool:
    return request.user.is_staff

  def _proxy_create_session(self, request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
      return JsonResponse({"error": "POST only"}, status=405)
    body = json.loads(request.body)
    resp = self._make_client(request.user, request).post(
      "/api/v1/interviews/interview-sessions/",
      data=body,
      format="json",
    )
    return self._to_json_response(resp)

  def _proxy_start(self, request: HttpRequest, session_uuid) -> JsonResponse:
    if request.method != "POST":
      return JsonResponse({"error": "POST only"}, status=405)
    resp = self._make_client(request.user, request).post(
      f"/api/v1/interviews/interview-sessions/{session_uuid}/start/",
      format="json",
    )
    return self._to_json_response(resp)

  def _proxy_answer(self, request: HttpRequest, session_uuid, turn_pk: int) -> JsonResponse:
    if request.method != "POST":
      return JsonResponse({"error": "POST only"}, status=405)
    body = json.loads(request.body)
    resp = self._make_client(request.user, request).post(
      f"/api/v1/interviews/interview-sessions/{session_uuid}/turns/{turn_pk}/answer/",
      data=body,
      format="json",
    )
    return self._to_json_response(resp)

  def _proxy_finish(self, request: HttpRequest, session_uuid) -> JsonResponse:
    if request.method != "POST":
      return JsonResponse({"error": "POST only"}, status=405)
    resp = self._make_client(request.user, request).post(
      f"/api/v1/interviews/interview-sessions/{session_uuid}/finish/",
      format="json",
    )
    return self._to_json_response(resp)

  def _proxy_report(self, request: HttpRequest, session_uuid) -> JsonResponse:
    resp = self._make_client(request.user, request).get(
      f"/api/v1/interviews/interview-sessions/{session_uuid}/analysis-report/",
      format="json",
    )
    return self._to_json_response(resp)

  def _proxy_load_session(self, request: HttpRequest, session_uuid) -> JsonResponse:
    """진행 중인 세션의 전체 상태(세션 정보 + 턴 목록)를 반환한다."""
    try:
      session = InterviewSession.objects.get(pk=session_uuid, user=request.user)
    except InterviewSession.DoesNotExist:
      return JsonResponse({"error": "세션을 찾을 수 없습니다."}, status=404)

    turns = list(
      InterviewTurn.objects.filter(
        interview_session=session
      ).order_by("turn_number").values("id", "turn_type", "question_source", "question", "answer", "turn_number")
    )

    return JsonResponse(
      {
        "uuid": str(session.pk),
        "interview_session_type": session.interview_session_type,
        "interview_difficulty_level": session.interview_difficulty_level,
        "interview_session_status": session.interview_session_status,
        "total_followup_questions": session.total_followup_questions,
        "turns": turns,
      }
    )

  @staticmethod
  def _make_client(user, request: HttpRequest | None = None) -> APIClient:
    """어드민 유저로 force_authenticate된 DRF API 클라이언트를 반환한다.

        request를 전달하면 HTTP_HOST를 동일하게 설정하여
        Django ALLOWED_HOSTS 검증을 통과시킨다.
        """
    client = APIClient()
    client.force_authenticate(user=user)
    if request is not None:
      client.defaults["HTTP_HOST"] = request.get_host()
    return client

  @staticmethod
  def _to_json_response(resp) -> JsonResponse:
    """APIClient 응답을 JsonResponse로 안전하게 변환한다.

        DRF Response는 .data 속성을 가지지만, 미들웨어/에러 등으로
        plain HttpResponse가 반환될 경우 content를 JSON 파싱한다.
        """
    if hasattr(resp, "data"):
      return JsonResponse(resp.data, status=resp.status_code, safe=False)
    try:
      data = json.loads(resp.content.decode("utf-8"))
    except Exception:
      data = {
        "error": "Non-JSON response from API",
        "status_code": resp.status_code,
        "content_preview": resp.content.decode("utf-8", errors="replace")[:300],
      }
    return JsonResponse(data, status=resp.status_code, safe=False)
