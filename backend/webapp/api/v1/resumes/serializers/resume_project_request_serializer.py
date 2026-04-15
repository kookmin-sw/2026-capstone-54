from rest_framework import serializers


class ResumeProjectRequestSerializer(serializers.Serializer):
  name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  role = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  period = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  tech_stack = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False)
  display_order = serializers.IntegerField(required=False, default=0)
