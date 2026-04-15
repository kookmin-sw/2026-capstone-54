from rest_framework import serializers


class ResumeJobCategoryRequestSerializer(serializers.Serializer):
  name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
