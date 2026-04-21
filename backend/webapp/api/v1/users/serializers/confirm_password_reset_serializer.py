from rest_framework import serializers


class ConfirmPasswordResetSerializer(serializers.Serializer):
  token = serializers.UUIDField()
  new_password = serializers.CharField(write_only=True)
