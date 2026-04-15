from rest_framework import serializers
from resumes.models import ResumeAward


class ResumeAwardResponseSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeAward
    fields = [
      "uuid",
      "name",
      "year",
      "organization",
      "description",
      "display_order",
      "created_at",
      "updated_at",
    ]
    read_only_fields = fields
