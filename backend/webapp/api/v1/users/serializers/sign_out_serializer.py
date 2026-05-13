from rest_framework import serializers


class SignOutSerializer(serializers.Serializer):
  refresh = serializers.CharField(required=False, allow_blank=True)
