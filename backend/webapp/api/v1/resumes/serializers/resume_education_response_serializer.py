from rest_framework import serializers
from resumes.models import ResumeEducation


class ResumeEducationResponseSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeEducation
    fields = ["uuid", "school", "degree", "major", "period", "display_order", "created_at", "updated_at"]
    read_only_fields = fields
