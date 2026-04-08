from rest_framework import serializers
from resumes.models import Resume


class ResumeSerializer(serializers.ModelSerializer):
  """이력서 응답 직렬화."""

  class Meta:
    model = Resume
    fields = [
      "uuid",
      "type",
      "title",
      "is_active",
      "analysis_status",
      "analysis_step",
      "analyzed_at",
      "created_at",
      "updated_at",
    ]
    read_only_fields = fields
