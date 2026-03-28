from api.v1.profiles.serializers import ProfileSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from profiles.models import Profile
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["프로필"])
class ProfileMeView(BaseAPIView):
  """내 프로필 조회 및 생성/수정 (upsert)"""

  permission_classes = [IsEmailVerified]
  serializer_class = ProfileSerializer

  @extend_schema(summary="내 프로필 조회")
  def get(self, request, *args, **kwargs):
    """현재 사용자의 프로필 반환. 프로필이 없으면 404."""
    profile = get_object_or_404(Profile, user=self.current_user)
    return Response(self.get_serializer(profile).data)

  @extend_schema(summary="내 프로필 생성/수정")
  @transaction.atomic
  def post(self, request, *args, **kwargs):
    """프로필이 없으면 생성(201), 있으면 수정(200)."""
    profile = Profile.objects.select_for_update().filter(user=self.current_user).first()
    created = profile is None

    serializer = self.get_serializer(profile, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(user=self.current_user)

    if created and not request.user.profile_completed_at:
      request.user.profile_completed_at = timezone.now()
      request.user.save(update_fields=["profile_completed_at"])

    code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return Response(serializer.data, status=code)
