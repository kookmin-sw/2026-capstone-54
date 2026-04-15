from rest_framework import serializers
from resumes.models import ResumeSummary


class ResumeSummaryResponseSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeSummary
    fields = ["uuid", "text", "created_at", "updated_at"]
    read_only_fields = fields
