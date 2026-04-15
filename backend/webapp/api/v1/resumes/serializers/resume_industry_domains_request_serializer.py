from rest_framework import serializers


class ResumeIndustryDomainsRequestSerializer(serializers.Serializer):
  industry_domains = serializers.ListField(child=serializers.CharField(allow_blank=True))
