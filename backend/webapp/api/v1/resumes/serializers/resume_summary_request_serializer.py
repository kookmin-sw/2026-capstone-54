from rest_framework import serializers


class ResumeSummaryRequestSerializer(serializers.Serializer):
  text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
