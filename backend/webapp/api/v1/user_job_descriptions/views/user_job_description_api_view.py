from api.v1.user_job_descriptions.serializers import (
  CreateUserJobDescriptionSerializer,
  UserJobDescriptionListSerializer,
  UserJobDescriptionResponseSerializer,
)
from common.filters import TrigramSearchFilter
from common.pagination import StandardPagination
from common.views import BaseAPIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiParameter, extend_schema
from job_descriptions.enums import ApplicationStatus
from job_descriptions.models import UserJobDescription
from job_descriptions.services import CreateUserJobDescriptionService
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["사용자 채용공고"])
class UserJobDescriptionAPIView(BaseAPIView):
  """사용자 채용공고 등록 및 목록 조회."""

  serializer_class = CreateUserJobDescriptionSerializer
  pagination_class = StandardPagination
  filter_backends = [DjangoFilterBackend, TrigramSearchFilter]
  filterset_fields = ["application_status"]
  search_fields = ["title", "job_description__company"]
  trigram_threshold = 0.1

  @extend_schema(
    summary="사용자 채용공고 목록 조회",
    parameters=[
      OpenApiParameter(
        name="application_status",
        description="지원상태 필터 (planned, saved, applied)",
        required=False,
        enum=[s.value for s in ApplicationStatus],
      ),
      OpenApiParameter(
        name="search",
        description="회사명 또는 내 식별 제목으로 검색",
        required=False,
        type=str,
      ),
    ],
    responses={200: UserJobDescriptionListSerializer(many=True)},
  )
  def get(self, request):
    queryset = (
      UserJobDescription.objects.filter(user=self.current_user
                                        ).select_related("job_description").order_by("-created_at")
    )

    for backend in self.filter_backends:
      queryset = backend().filter_queryset(request, queryset, self)

    page = self.paginate_queryset(queryset)
    if page is not None:
      serializer = UserJobDescriptionListSerializer(page, many=True)
      return self.get_paginated_response(serializer.data)

    serializer = UserJobDescriptionListSerializer(queryset, many=True)
    return Response(serializer.data)

  @extend_schema(
    summary="사용자 채용공고 등록",
    request=CreateUserJobDescriptionSerializer,
    responses={201: UserJobDescriptionResponseSerializer},
  )
  def post(self, request):
    serializer = CreateUserJobDescriptionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user_job_description = CreateUserJobDescriptionService(
      user=self.current_user,
      url=serializer.validated_data["url"],
      title=serializer.validated_data.get("title", ""),
      application_status=serializer.validated_data.get("application_status"),
    ).perform()

    response = UserJobDescriptionResponseSerializer(user_job_description)
    return Response(response.data, status=status.HTTP_201_CREATED)
