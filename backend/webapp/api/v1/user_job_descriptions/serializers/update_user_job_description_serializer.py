from job_descriptions.enums import ApplicationStatus
from rest_framework import serializers


class UpdateUserJobDescriptionSerializer(serializers.Serializer):
  title = serializers.CharField(max_length=255, required=False)
  application_status = serializers.ChoiceField(
    choices=ApplicationStatus.choices,
    required=False,
  )
