from job_descriptions.models import JobDescription, UserJobDescription
from rest_framework import serializers


class JobDescriptionSerializer(serializers.ModelSerializer):
  """JobDescription 전체 필드 직렬화."""

  class Meta:
    model = JobDescription
    fields = [
      "id",
      "url",
      "platform",
      "company",
      "title",
      "duties",
      "requirements",
      "preferred",
      "work_type",
      "salary",
      "location",
      "education",
      "experience",
      "collection_status",
      "scraped_at",
      "error_message",
      "created_at",
      "updated_at",
    ]
    read_only_fields = fields


class UserJobDescriptionListSerializer(serializers.ModelSerializer):
  """사용자 채용공고 목록 응답 직렬화."""

  job_description = JobDescriptionSerializer(read_only=True)

  class Meta:
    model = UserJobDescription
    fields = [
      "uuid",
      "title",
      "job_description",
      "application_status",
      "created_at",
    ]
    read_only_fields = fields
