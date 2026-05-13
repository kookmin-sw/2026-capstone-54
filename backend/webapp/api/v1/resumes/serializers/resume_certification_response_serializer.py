from rest_framework import serializers
from resumes.models import ResumeCertification


class ResumeCertificationResponseSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeCertification
    fields = ["uuid", "name", "issuer", "date", "display_order", "created_at", "updated_at"]
    read_only_fields = fields
