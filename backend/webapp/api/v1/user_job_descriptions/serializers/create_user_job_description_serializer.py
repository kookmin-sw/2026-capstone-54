from rest_framework import serializers


class CreateUserJobDescriptionSerializer(serializers.Serializer):
  url = serializers.URLField()
