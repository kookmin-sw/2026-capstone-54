"""이력서 CRUD ViewSet. 목록 조회, 생성, 상세 조회, 수정, 삭제를 처리한다."""

from api.v1.resumes.filters import ResumeFilter
from api.v1.resumes.serializers import (
  ResumeCreateRequestSerializer,
  ResumeDetailSerializer,
  ResumeSerializer,
  ResumeUpdateSerializer,
)
from common.exceptions import NotFoundException
from common.permissions import IsEmailVerified
from common.views import BaseGenericViewSet
from django_filters import rest_framework as filters
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from resumes.enums import ResumeType
from resumes.models import Resume
from resumes.services import (
  CreateFileResumeService,
  CreateTextResumeService,
  DeleteResumeService,
  UpdateFileResumeService,
  UpdateTextResumeService,
)


@extend_schema(tags=["이력서"])
class ResumeViewSet(BaseGenericViewSet):
  """이력서 CRUD ViewSet."""

  permission_classes = [IsEmailVerified]
  serializer_class = ResumeSerializer
  filter_backends = [filters.DjangoFilterBackend]
  filterset_class = ResumeFilter
  lookup_field = "uuid"

  def get_queryset(self):
    return Resume.objects.filter(user=self.current_user).order_by("-created_at")

  def get_object(self):
    """현재 사용자 소유 이력서를 조회한다. 없으면 NotFoundException."""
    try:
      return self.get_queryset().get(pk=self.kwargs[self.lookup_field])
    except Resume.DoesNotExist:
      raise NotFoundException("이력서를 찾을 수 없습니다.")

  @extend_schema(summary="내 이력서 목록 조회", responses={200: ResumeSerializer(many=True)})
  def list(self, request):
    queryset = self.filter_queryset(self.get_queryset())
    serializer = self.get_serializer(queryset, many=True)
    return Response(serializer.data)

  @extend_schema(summary="이력서 통합 생성", request=ResumeCreateRequestSerializer, responses={202: ResumeSerializer})
  def create(self, request):
    serializer = ResumeCreateRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if data["type"] == ResumeType.TEXT:
      resume = CreateTextResumeService(
        user=self.current_user,
        title=data["title"],
        content=data["content"],
      ).perform()
    elif data["type"] == ResumeType.FILE:
      resume = CreateFileResumeService(
        user=self.current_user,
        title=data["title"],
        file=data["file"],
      ).perform()

    return Response(ResumeSerializer(resume).data, status=status.HTTP_202_ACCEPTED)

  @extend_schema(summary="이력서 상세 조회", responses={200: ResumeDetailSerializer})
  def retrieve(self, request, uuid=None):
    resume = self.get_object()
    return Response(ResumeDetailSerializer(resume).data)

  @extend_schema(summary="이력서 전체 수정", request=ResumeUpdateSerializer, responses={200: ResumeDetailSerializer})
  def update(self, request, uuid=None):
    resume = self.get_object()
    serializer = ResumeUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    updated = self._perform_update(resume, serializer.validated_data)
    return Response(ResumeDetailSerializer(updated).data)

  @extend_schema(summary="이력서 부분 수정", request=ResumeUpdateSerializer, responses={200: ResumeDetailSerializer})
  def partial_update(self, request, uuid=None):
    resume = self.get_object()
    serializer = ResumeUpdateSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    updated = self._perform_update(resume, serializer.validated_data)
    return Response(ResumeDetailSerializer(updated).data)

  @extend_schema(summary="이력서 삭제", responses={204: None})
  def destroy(self, request, uuid=None):
    resume = self.get_object()
    DeleteResumeService(resume=resume).perform()
    return Response(status=status.HTTP_204_NO_CONTENT)

  def _perform_update(self, resume, validated_data):
    """resume.type에 따라 적절한 Update 서비스를 호출한다."""
    if resume.type == ResumeType.TEXT:
      return UpdateTextResumeService(user=self.current_user, resume=resume, **validated_data).perform()
    elif resume.type == ResumeType.FILE:
      return UpdateFileResumeService(user=self.current_user, resume=resume, **validated_data).perform()
