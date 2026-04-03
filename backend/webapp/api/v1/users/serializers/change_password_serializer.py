from rest_framework import serializers


class ChangePasswordSerializer(serializers.Serializer):
  old_password = serializers.CharField(write_only=True)
  new_password = serializers.CharField(write_only=True)
