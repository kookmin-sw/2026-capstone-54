"""POST /user-job-descriptions/ 응답 Serializer.

ModelSerializer 를 사용해 JobDescription 의 collection_status 를 source 지정으로
선언적으로 포함한다. 뷰에서 응답 dict 를 손으로 조립할 필요가 없다.
"""

from job_descriptions.models import UserJobDescription
from rest_framework import serializers


class UserJobDescriptionResponseSerializer(serializers.ModelSerializer):
  """사용자 채용공고 생성 응답 (uuid + 수집 상태)."""

  job_description_id = serializers.IntegerField(source="job_description.id", read_only=True)
  collection_status = serializers.CharField(
    source="job_description.collection_status",
    read_only=True,
  )

  class Meta:
    model = UserJobDescription
    fields = ["uuid", "title", "job_description_id", "collection_status", "application_status", "created_at"]
    read_only_fields = fields
