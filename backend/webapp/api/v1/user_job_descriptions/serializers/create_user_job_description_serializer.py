from job_descriptions.enums import ApplicationStatus
from rest_framework import serializers


class CreateUserJobDescriptionSerializer(serializers.Serializer):
  url = serializers.URLField()
  title = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")
  application_status = serializers.ChoiceField(
    choices=ApplicationStatus.choices,
    default=ApplicationStatus.PLANNED,
    required=False,
  )
