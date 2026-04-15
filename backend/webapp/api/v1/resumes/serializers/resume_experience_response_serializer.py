from rest_framework import serializers
from resumes.models import ResumeExperience


class ResumeExperienceResponseSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeExperience
    fields = [
      "uuid",
      "company",
      "role",
      "period",
      "responsibilities",
      "highlights",
      "display_order",
      "created_at",
      "updated_at",
    ]
    read_only_fields = fields
