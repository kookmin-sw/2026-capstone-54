from rest_framework import serializers


class ResumeKeywordsRequestSerializer(serializers.Serializer):
  keywords = serializers.ListField(child=serializers.CharField(allow_blank=True))
