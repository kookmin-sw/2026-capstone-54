from rest_framework import serializers


class ResumeAwardRequestSerializer(serializers.Serializer):
  name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  year = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  organization = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  display_order = serializers.IntegerField(required=False, default=0)
