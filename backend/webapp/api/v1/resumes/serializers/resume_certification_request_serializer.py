from rest_framework import serializers


class ResumeCertificationRequestSerializer(serializers.Serializer):
  name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  issuer = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
  display_order = serializers.IntegerField(required=False, default=0)
