"""이력서 CRUD ViewSet. 목록 / 상세 / 생성 / 수정 / 삭제 + 활성화·최종저장 액션."""

from api.v1.resumes.filters import ResumeFilter
from api.v1.resumes.serializers import (
  ResumeDetailSerializer,
  ResumeFileCreateRequestSerializer,
  ResumeSerializer,
  ResumeStructuredCreateRequestSerializer,
  ResumeTextCreateRequestSerializer,
  ResumeUpdateSerializer,
)
from common.exceptions import NotFoundException, ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseGenericViewSet
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from resumes.enums import ResumeType
from resumes.models import Resume
from resumes.services import (
  ActivateResumeService,
  CreateFileResumeService,
  CreateTextResumeService,
  DeactivateResumeService,
  DeleteResumeService,
  FinalizeResumeService,
  UpdateFileResumeService,
  UpdateTextResumeService,
)
from resumes.services.resume_prefetch import resume_full_queryset


@extend_schema(tags=["이력서"])
class ResumeViewSet(BaseGenericViewSet):
  """이력서 CRUD ViewSet."""

  SUPPORTED_RESUME_TYPES = [
    ResumeType.FILE,
    ResumeType.TEXT,
    ResumeType.STRUCTURED,
  ]

  permission_classes = [IsEmailVerified]
  serializer_class = ResumeSerializer
  filter_backends = [filters.DjangoFilterBackend]
  filterset_class = ResumeFilter
  lookup_field = "uuid"

  def get_queryset(self):
    """action 에 따라 필요한 관계만 prefetch 해 N+1 을 방지한다.

    list: `resume_job_category` FK 만 select_related.
    detail/update/등: 공용 `resume_full_queryset()` 을 사용 (모든 sub-model preload).
    """
    if self.action == "list":
      return (
        Resume.objects.filter(user=self.current_user).select_related("resume_job_category").order_by("-created_at")
      )
    return resume_full_queryset().filter(user=self.current_user).order_by("-created_at")

  def get_object(self):
    """현재 사용자 소유 이력서를 조회한다. 없으면 NotFoundException."""
    try:
      return self.get_queryset().get(pk=self.kwargs[self.lookup_field])
    except Resume.DoesNotExist:
      raise NotFoundException("이력서를 찾을 수 없습니다.")

  def _reload_with_prefetch(self, pk):
    """Mutation 후 detail serializer 가 N+1 없이 동작하도록 다시 가져온다."""
    return resume_full_queryset().filter(user=self.current_user).get(pk=pk)

  @extend_schema(summary="내 이력서 목록 조회", responses={200: ResumeSerializer(many=True)})
  def list(self, request):
    queryset = self.filter_queryset(self.get_queryset())
    page = self.paginate_queryset(queryset)
    if page is not None:
      serializer = self.get_serializer(page, many=True)
      return self.get_paginated_response(serializer.data)
    serializer = self.get_serializer(queryset, many=True)
    return Response(serializer.data)

  @extend_schema(
    summary="이력서 통합 생성",
    description=(
      "입력 방식(type) 에 따라 3가지 경로로 분기된다:\n"
      "- text: 원문 텍스트 → LLM 분석 파이프라인 발행 (ResumeTextCreateRequestSerializer)\n"
      "- file: PDF 업로드 → 추출 + LLM 분석 파이프라인 발행 (ResumeFileCreateRequestSerializer)\n"
      "- structured: 사용자가 구조화 UI 로 이미 작성 → 분석 생략, 곧바로 임베딩 발행 "
      "(ResumeStructuredCreateRequestSerializer, nested)"
    ),
    responses={202: ResumeSerializer},
  )
  def create(self, request):
    resume_type = request.data.get("type")
    if resume_type == ResumeType.TEXT:
      resume = self._create_text_resume(request)
    elif resume_type == ResumeType.FILE:
      resume = self._create_file_resume(request)
    elif resume_type == ResumeType.STRUCTURED:
      resume = self._create_structured_resume(request)
    else:
      raise ValidationException(f"지원하지 않는 이력서 타입입니다: {resume_type!r}")
    return Response(ResumeSerializer(resume).data, status=status.HTTP_202_ACCEPTED)

  def _create_text_resume(self, request) -> Resume:
    """text 모드: 원문 텍스트 → LLM 분석 파이프라인."""
    serializer = ResumeTextCreateRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return CreateTextResumeService(user=self.current_user, **serializer.validated_data).perform()

  def _create_file_resume(self, request) -> Resume:
    """file 모드: PDF 업로드 → 추출 + LLM 분석 파이프라인."""
    serializer = ResumeFileCreateRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return CreateFileResumeService(user=self.current_user, **serializer.validated_data).perform()

  def _create_structured_resume(self, request) -> Resume:
    """structured 모드: 사용자가 이미 구조화된 데이터를 입력.

    drf-writable-nested 가 부모 + 자식 sub-model 을 한 번에 저장하고,
    곧바로 FinalizeResumeService 로 bundle 업로드 + reembed 를 발행한다.
    """
    serializer = ResumeStructuredCreateRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    resume = serializer.save(user=self.current_user)
    FinalizeResumeService(resume=resume).perform()
    return resume

  @extend_schema(summary="이력서 상세 조회", responses={200: ResumeDetailSerializer})
  def retrieve(self, request, uuid=None):
    resume = self.get_object()
    return Response(ResumeDetailSerializer(resume).data)

  @extend_schema(summary="이력서 전체 수정", request=ResumeUpdateSerializer, responses={200: ResumeDetailSerializer})
  def update(self, request, uuid=None):
    resume = self.get_object()
    serializer = ResumeUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    self._perform_update(resume, serializer.validated_data)
    return Response(ResumeDetailSerializer(self._reload_with_prefetch(resume.pk)).data)

  @extend_schema(summary="이력서 부분 수정", request=ResumeUpdateSerializer, responses={200: ResumeDetailSerializer})
  def partial_update(self, request, uuid=None):
    resume = self.get_object()
    serializer = ResumeUpdateSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    self._perform_update(resume, serializer.validated_data)
    return Response(ResumeDetailSerializer(self._reload_with_prefetch(resume.pk)).data)

  @extend_schema(summary="이력서 삭제", responses={204: None})
  def destroy(self, request, uuid=None):
    resume = self.get_object()
    DeleteResumeService(resume=resume).perform()
    return Response(status=status.HTTP_204_NO_CONTENT)

  def _perform_update(self, resume, validated_data):
    """resume.type 에 따라 적절한 Update 서비스를 호출한다."""
    if resume.type not in self.SUPPORTED_RESUME_TYPES:
      raise NotImplementedError(f"{resume.type} 타입은 지원하지 않습니다.")

    if resume.type == ResumeType.TEXT:
      return UpdateTextResumeService(user=self.current_user, resume=resume, **validated_data).perform()
    elif resume.type == ResumeType.FILE:
      return UpdateFileResumeService(user=self.current_user, resume=resume, **validated_data).perform()
    # STRUCTURED 는 전체 재작성 API 를 제공하지 않고 섹션 편집으로만 수정한다
    return resume

  @extend_schema(summary="이력서 활성화", responses={200: ResumeSerializer})
  @action(detail=True, methods=["post"], url_path="activate")
  def activate(self, request, uuid=None):
    resume = self.get_object()
    ActivateResumeService(resume=resume).perform()
    return Response(ResumeSerializer(resume).data)

  @extend_schema(summary="이력서 비활성화", responses={200: ResumeSerializer})
  @action(detail=True, methods=["post"], url_path="deactivate")
  def deactivate(self, request, uuid=None):
    resume = self.get_object()
    DeactivateResumeService(resume=resume).perform()
    return Response(ResumeSerializer(resume).data)

  @extend_schema(
    summary="이력서 최종 저장 (재임베딩 트리거)",
    responses={202: ResumeDetailSerializer},
  )
  @action(detail=True, methods=["post"], url_path="finalize")
  def finalize(self, request, uuid=None):
    """섹션 인라인 편집을 마친 뒤 호출한다.

    is_dirty 를 해제하고 analysis-resume 워커에 reembed 태스크를 dispatch 한다.
    파이프라인 자체는 비동기이므로 즉시 202 + 현재 상세 상태로 응답한다.
    """
    resume = self.get_object()
    FinalizeResumeService(resume=resume).perform()
    return Response(
      ResumeDetailSerializer(self._reload_with_prefetch(resume.pk)).data,
      status=status.HTTP_202_ACCEPTED,
    )
