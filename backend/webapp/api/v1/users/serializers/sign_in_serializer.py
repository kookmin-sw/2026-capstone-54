from rest_framework import serializers


class SignInSerializer(serializers.Serializer):
  email = serializers.EmailField()
  password = serializers.CharField(write_only=True)
