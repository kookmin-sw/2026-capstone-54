from rest_framework import serializers
from resumes.models import ResumeLanguageSpoken


class ResumeLanguageSpokenResponseSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeLanguageSpoken
    fields = ["uuid", "language", "level", "display_order", "created_at", "updated_at"]
    read_only_fields = fields
