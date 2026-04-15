from rest_framework import serializers


class ResumeLanguageSpokenRequestSerializer(serializers.Serializer):
  language = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  level = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  display_order = serializers.IntegerField(required=False, default=0)
