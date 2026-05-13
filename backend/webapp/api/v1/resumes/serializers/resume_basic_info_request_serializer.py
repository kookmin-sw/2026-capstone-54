from rest_framework import serializers


class ResumeBasicInfoRequestSerializer(serializers.Serializer):
  name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  email = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  phone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
