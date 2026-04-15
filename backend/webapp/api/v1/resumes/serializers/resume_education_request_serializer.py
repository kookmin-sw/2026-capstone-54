from rest_framework import serializers


class ResumeEducationRequestSerializer(serializers.Serializer):
  school = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  degree = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  major = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  period = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  display_order = serializers.IntegerField(required=False, default=0)
