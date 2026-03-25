from rest_framework import serializers


class VerifyEmailSerializer(serializers.Serializer):
  code = serializers.CharField(max_length=6, min_length=6)
