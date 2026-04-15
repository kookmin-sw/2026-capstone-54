from api.v1.user_job_descriptions.serializers import UserJobDescriptionListSerializer
from common.exceptions import NotFoundException
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from job_descriptions.models import UserJobDescription
from rest_framework.response import Response


@extend_schema(tags=["사용자 채용공고"])
class UserJobDescriptionDetailAPIView(BaseAPIView):
  """사용자 채용공고 상세 조회."""

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
