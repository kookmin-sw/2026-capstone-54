from rest_framework import serializers
from resumes.models import ResumeBasicInfo


class ResumeBasicInfoResponseSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeBasicInfo
    fields = ["uuid", "name", "email", "phone", "location", "created_at", "updated_at"]
    read_only_fields = fields
