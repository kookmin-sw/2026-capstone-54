from rest_framework import serializers


class ResumeCareerMetaRequestSerializer(serializers.Serializer):
  total_experience_years = serializers.IntegerField(required=False, allow_null=True, min_value=0)
  total_experience_months = serializers.IntegerField(required=False, allow_null=True, min_value=0, max_value=11)
