from rest_framework import serializers


class ResumeExperienceRequestSerializer(serializers.Serializer):
  company = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  role = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  period = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  responsibilities = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
  highlights = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
  display_order = serializers.IntegerField(required=False, default=0)
