"""
이력서 유사도 검색 플레이그라운드 어드민.

ResumeEmbedding의 proxy model을 등록하여 별도 어드민 페이지로 제공한다.
사용자/이력서를 선택하고 키워드를 입력하면 pgvector 코사인 유사도 검색 결과를
임베딩 단위로 확인할 수 있다.
"""

import logging

from django import forms
from django.contrib import admin
from django.db import connection as django_conn
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.urls import path, reverse
from pgvector.django import CosineDistance
from resumes.models import Resume, ResumeEmbedding
from resumes.services.resume_search_service import _embed_query
from unfold.admin import ModelAdmin
from unfold.decorators import action
from unfold.widgets import UnfoldAdminSelectWidget, UnfoldAdminTextInputWidget

logger = logging.getLogger(__name__)


class SearchPlaygroundProxy(ResumeEmbedding):
  """검색 플레이그라운드 전용 proxy model."""

  class Meta:
    proxy = True
    verbose_name = "검색 플레이그라운드"
    verbose_name_plural = "검색 플레이그라운드"


# ── 폼 ──────────────────────────────────────────────────────────────────────


class _SearchForm(forms.Form):
  """유사도 검색 입력 폼."""

  user = forms.ModelChoiceField(
    label="사용자",
    queryset=None,
    required=True,
    widget=UnfoldAdminSelectWidget,
    help_text="검색 대상 사용자를 선택하세요.",
  )
  resume = forms.ModelChoiceField(
    label="이력서 (선택)",
    queryset=Resume.objects.none(),
    required=False,
    widget=UnfoldAdminSelectWidget,
    help_text="특정 이력서 내에서만 검색합니다. 비워두면 전체.",
  )
  keyword = forms.CharField(
    label="검색어",
    max_length=500,
    required=True,
    widget=UnfoldAdminTextInputWidget(attrs={"placeholder": "예: Python 백엔드 개발 경험"}),
  )
  top_k = forms.IntegerField(
    label="최대 결과 수",
    initial=10,
    min_value=1,
    max_value=50,
    required=True,
    widget=UnfoldAdminTextInputWidget,
  )
  similarity_threshold = forms.FloatField(
    label="유사도 임계값",
    initial=0.0,
    min_value=0.0,
    max_value=1.0,
    required=True,
    widget=UnfoldAdminTextInputWidget,
    help_text="0.0~1.0. 낮을수록 더 많은 결과.",
  )

  def __init__(self, *args, **kwargs):
    """사용자 선택 시 해당 사용자의 이력서만 resume 드롭다운에 표시."""
    from django.contrib.auth import get_user_model
    super().__init__(*args, **kwargs)
    self.fields["user"].queryset = get_user_model().objects.all().order_by("email")
    if self.data.get("user"):
      try:
        self.fields["resume"].queryset = Resume.objects.filter(
          user_id=int(self.data["user"]),
          deleted_at__isnull=True,
        ).order_by("-created_at")
      except (ValueError, TypeError):
        pass


# ── 어드민 ──────────────────────────────────────────────────────────────────


@admin.register(SearchPlaygroundProxy)
class SearchPlaygroundAdmin(ModelAdmin):
  """이력서 유사도 검색을 실험하는 어드민 페이지."""

  actions_list = ["search_playground"]

  def has_add_permission(self, request):
    """proxy model이므로 직접 추가 불가."""
    return False

  def has_change_permission(self, request, obj=None):
    """proxy model이므로 직접 수정 불가."""
    return False

  # ── URL 등록 ────────────────────────────────────────────────────────────

  def get_urls(self):
    """사용자별 이력서 목록 JSON 엔드포인트를 추가한다."""
    urls = super().get_urls()
    custom = [
      path(
        "user-resumes/<int:user_id>/",
        self.admin_site.admin_view(self._user_resumes_json),
        name="resumes_searchplayground_user_resumes",
      ),
    ]
    return custom + urls

  # ── 액션 ────────────────────────────────────────────────────────────────

  @action(description="이력서 검색 플레이그라운드", url_path="search-playground")
  def search_playground(self, request: HttpRequest) -> HttpResponse:
    """검색 폼을 렌더링하고, POST 시 유사도 검색을 실행한다."""
    form = _SearchForm(request.POST or None)
    context = self._build_base_context(request, form)

    if request.method == "POST" and form.is_valid():
      self._execute_search(form, context)

    return render(request, "admin/resumes/search_playground.html", context)

  def has_search_playground_permission(self, request: HttpRequest) -> bool:
    """staff 사용자만 접근 가능."""
    return request.user.is_staff

  # ── Private: 컨텍스트 ──────────────────────────────────────────────────

  def _build_base_context(self, request: HttpRequest, form: _SearchForm) -> dict:
    """템플릿에 전달할 기본 컨텍스트를 구성한다."""
    user_resumes_url = reverse("admin:resumes_searchplaygroundproxy_changelist") + "user-resumes/"
    return {
      "form": form,
      "results": None,
      "search_tokens": 0,
      "debug_info": None,
      "error": None,
      "title": "이력서 검색 플레이그라운드",
      "user_resumes_url": user_resumes_url,
      **self.admin_site.each_context(request),
    }

  # ── Private: 검색 실행 ─────────────────────────────────────────────────

  def _execute_search(self, form: _SearchForm, context: dict) -> None:
    """폼 데이터로 유사도 검색을 실행하고 context를 갱신한다."""
    user = form.cleaned_data["user"]
    resume = form.cleaned_data.get("resume")
    keyword = form.cleaned_data["keyword"]
    top_k = form.cleaned_data["top_k"]
    threshold = form.cleaned_data["similarity_threshold"]
    resume_pk = resume.pk if resume else None

    context["debug_info"] = self._collect_debug_info(user.id, resume_pk)

    try:
      query_vector, search_tokens = _embed_query(keyword)
      context["search_tokens"] = search_tokens

      embeddings = self._query_embeddings(user.id, resume_pk, query_vector, top_k)
      context["debug_info"]["distance_samples"] = self._extract_distance_samples(embeddings)
      context["results"] = self._filter_by_threshold(embeddings, threshold)

    except Exception as exc:
      logger.error("검색 플레이그라운드 오류: %s", exc, exc_info=True)
      context["error"] = f"검색 중 오류가 발생했습니다: {exc}"

  # ── Private: 임베딩 쿼리 ───────────────────────────────────────────────

  def _query_embeddings(
    self,
    user_id: int,
    resume_pk: str | None,
    query_vector: list[float],
    top_k: int,
  ) -> list:
    """코사인 유사도로 임베딩을 검색한다."""
    qs = ResumeEmbedding.objects.filter(
      user_id=user_id,
      resume__is_active=True,
      resume__deleted_at__isnull=True,
      resume__analysis_status="completed",
    )
    if resume_pk:
      qs = qs.filter(resume_id=resume_pk)

    return list(
      qs.annotate(distance=CosineDistance("embedding_vector", query_vector)
                  ).order_by("distance").select_related("resume")[:top_k]
    )

  @staticmethod
  def _extract_distance_samples(embeddings: list) -> list[dict]:
    """상위 5개 임베딩의 distance 값을 추출한다."""
    return [
      {
        "chunk_index": e.chunk_index,
        "distance": round(float(e.distance), 4) if e.distance is not None else None,
      } for e in embeddings[:5]
    ]

  @staticmethod
  def _filter_by_threshold(embeddings: list, threshold: float) -> list[dict]:
    """threshold를 적용하여 결과 dict 목록을 반환한다."""
    results = []
    for emb in embeddings:
      if emb.distance is None or float(emb.distance) > 1 - threshold:
        continue
      results.append(
        {
          "embedding_uuid": str(emb.uuid),
          "resume_uuid": str(emb.resume_id),
          "title": emb.resume.title,
          "similarity": round(1 - float(emb.distance), 4),
          "context": emb.context,
          "chunk_type": emb.chunk_type,
          "chunk_index": emb.chunk_index,
        }
      )
    return results

  # ── Private: 디버그 정보 ───────────────────────────────────────────────

  @staticmethod
  def _collect_debug_info(user_id: int, resume_pk: str | None = None) -> dict:
    """검색 디버깅을 위한 사용자 데이터 요약을 수집한다."""
    resumes = Resume.objects.filter(user_id=user_id, deleted_at__isnull=True)
    emb_filter: dict = {"user_id": user_id}
    if resume_pk:
      emb_filter["resume_id"] = resume_pk

    return {
      "total_resumes": resumes.count(),
      "active_completed": resumes.filter(is_active=True, analysis_status="completed").count(),
      "status_summary": list(resumes.values_list("uuid", "title", "analysis_status", "is_active")),
      "total_embeddings": ResumeEmbedding.objects.filter(**emb_filter).count(),
      "embeddings_with_vector": ResumeEmbedding.objects.filter(**emb_filter, embedding_vector__isnull=False).count(),
      "vector_check": SearchPlaygroundAdmin._check_vector_type(user_id, resume_pk),
    }

  @staticmethod
  def _check_vector_type(user_id: int, resume_pk: str | None = None) -> dict | None:
    """DB에서 벡터 컬럼의 타입과 차원을 확인한다."""
    sql = """
      SELECT pg_typeof(embedding_vector)::text, vector_dims(embedding_vector)
      FROM resume_embeddings
      WHERE user_id = %s AND embedding_vector IS NOT NULL
    """
    params: list = [user_id]
    if resume_pk:
      sql += " AND resume_id = %s"
      params.append(resume_pk)
    sql += " LIMIT 1"

    with django_conn.cursor() as cur:
      cur.execute(sql, params)
      row = cur.fetchone()
    return {"type": row[0], "dims": row[1]} if row else None

  # ── Private: AJAX ──────────────────────────────────────────────────────

  @staticmethod
  def _user_resumes_json(request: HttpRequest, user_id: int) -> JsonResponse:
    """사용자의 이력서 목록을 JSON으로 반환한다."""
    resumes = (
      Resume.objects.filter(user_id=user_id,
                            deleted_at__isnull=True).order_by("-created_at").values("uuid", "title", "analysis_status")
    )
    return JsonResponse(list(resumes), safe=False)
