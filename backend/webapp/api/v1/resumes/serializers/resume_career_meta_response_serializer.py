from rest_framework import serializers
from resumes.models import ResumeCareerMeta


class ResumeCareerMetaResponseSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeCareerMeta
    fields = [
      "uuid",
      "total_experience_years",
      "total_experience_months",
      "created_at",
      "updated_at",
    ]
    read_only_fields = fields
