from common.views import BaseAPIView
from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema, inline_serializer
from job_descriptions.enums import ApplicationStatus
from job_descriptions.models import UserJobDescription
from rest_framework import serializers
from rest_framework.response import Response


@extend_schema(tags=["사용자 채용공고"])
class UserJobDescriptionStatsCountView(BaseAPIView):
  """사용자 채용공고 지원상태별 카운트 조회."""

  @extend_schema(
    summary="사용자 채용공고 상태별 카운트",
    responses={
      200: inline_serializer(
        name="UserJobDescriptionStatsCount",
        fields={
          "total": serializers.IntegerField(),
          "planned": serializers.IntegerField(),
          "saved": serializers.IntegerField(),
          "applied": serializers.IntegerField(),
        },
      )
    },
  )
  def get(self, request):
    counts = UserJobDescription.objects.filter(user=self.current_user).aggregate(
      total=Count("uuid"),
      planned=Count("uuid", filter=Q(application_status=ApplicationStatus.PLANNED)),
      saved=Count("uuid", filter=Q(application_status=ApplicationStatus.SAVED)),
      applied=Count("uuid", filter=Q(application_status=ApplicationStatus.APPLIED)),
    )
    return Response(counts)
