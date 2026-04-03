from api.v1.profiles.serializers import AvatarSerializer
from common.exceptions import ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from django.shortcuts import get_object_or_404
from djangorestframework_camel_case.parser import CamelCaseMultiPartParser
from drf_spectacular.utils import extend_schema
from profiles.models import Profile
from profiles.services import AvatarUploadService
from rest_framework.response import Response


@extend_schema(tags=["프로필"])
class AvatarAPIView(BaseAPIView):
  """프로필 아바타 이미지를 조회/업로드/교체한다."""

  permission_classes = [IsEmailVerified]
  serializer_class = AvatarSerializer
  parser_classes = [CamelCaseMultiPartParser]

  @extend_schema(
    summary="아바타 조회",
    responses={200: AvatarSerializer},
  )
  def get(self, request):
    profile = get_object_or_404(Profile, user=self.current_user)
    serializer = AvatarSerializer(profile)
    return Response(serializer.data)

  @extend_schema(
    summary="아바타 업로드",
    request={
      "multipart/form-data": {
        "type": "object",
        "properties": {
          "avatar": {
            "type": "string",
            "format": "binary",
          },
        },
        "required": ["avatar"],
      },
    },
    responses={200: AvatarSerializer},
  )
  def post(self, request):
    avatar_file = request.FILES.get("avatar")
    if not avatar_file:
      raise ValidationException(field_errors={"avatar": ["이미지 파일을 첨부해주세요."]})

    profile = AvatarUploadService(
      user=self.current_user,
      avatar=avatar_file,
    ).perform()

    return Response(AvatarSerializer(profile).data, status=200)
