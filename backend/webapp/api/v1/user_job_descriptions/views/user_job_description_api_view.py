from api.v1.user_job_descriptions.serializers import (
  CreateUserJobDescriptionSerializer,
  UserJobDescriptionListSerializer,
  UserJobDescriptionResponseSerializer,
)
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from job_descriptions.models import UserJobDescription
from job_descriptions.services import CreateUserJobDescriptionService
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["사용자 채용공고"])
class UserJobDescriptionAPIView(BaseAPIView):
  """사용자 채용공고 등록 및 목록 조회."""

  serializer_class = CreateUserJobDescriptionSerializer

  @extend_schema(
    summary="사용자 채용공고 목록 조회",
    responses={200: UserJobDescriptionListSerializer(many=True)},
  )
  def get(self, request):
    queryset = (
      UserJobDescription.objects.filter(user=self.current_user
                                        ).select_related("job_description").order_by("-created_at")
    )
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
    ).perform()

    response_data = UserJobDescriptionResponseSerializer(
      {
        "uuid": user_job_description.uuid,
        "job_description_id": user_job_description.job_description_id,
        "collection_status": user_job_description.job_description.collection_status,
        "created_at": user_job_description.created_at,
      }
    ).data
    return Response(response_data, status=status.HTTP_201_CREATED)
