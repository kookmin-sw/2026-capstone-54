from api.v1.user_job_descriptions.serializers import (
  UpdateUserJobDescriptionSerializer,
  UserJobDescriptionListSerializer,
)
from common.exceptions import NotFoundException
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from job_descriptions.models import UserJobDescription
from job_descriptions.services import (
  DeleteUserJobDescriptionService,
  UpdateUserJobDescriptionService,
)
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["사용자 채용공고"])
class UserJobDescriptionDetailAPIView(BaseAPIView):
  """사용자 채용공고 상세 조회 및 수정."""

  serializer_class = UserJobDescriptionListSerializer

  @extend_schema(
    summary="사용자 채용공고 상세 조회",
    responses={200: UserJobDescriptionListSerializer},
  )
  def get(self, request, uuid):
    try:
      user_job_description = (
        UserJobDescription.objects.filter(user=self.current_user).select_related("job_description").get(uuid=uuid)
      )
    except UserJobDescription.DoesNotExist:
      raise NotFoundException("채용공고를 찾을 수 없습니다.")

    serializer = UserJobDescriptionListSerializer(user_job_description)
    return Response(serializer.data)

  @extend_schema(
    summary="사용자 채용공고 수정 (제목, 지원상태)",
    request=UpdateUserJobDescriptionSerializer,
    responses={200: UserJobDescriptionListSerializer},
  )
  def patch(self, request, uuid):
    serializer = UpdateUserJobDescriptionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user_job_description = UpdateUserJobDescriptionService(
      user=self.current_user,
      uuid=str(uuid),
      **serializer.validated_data,
    ).perform()

    response = UserJobDescriptionListSerializer(user_job_description)
    return Response(response.data)

  @extend_schema(summary="사용자 채용공고 삭제", responses={204: None})
  def delete(self, request, uuid):
    try:
      user_job_description = (
        UserJobDescription.objects.filter(user=self.current_user).select_related("job_description").get(uuid=uuid)
      )
    except UserJobDescription.DoesNotExist:
      raise NotFoundException("채용공고를 찾을 수 없습니다.")

    DeleteUserJobDescriptionService(user_job_description=user_job_description).perform()
    return Response(status=status.HTTP_204_NO_CONTENT)
