from rest_framework import serializers


class UpdateUserNameSerializer(serializers.Serializer):
  name = serializers.CharField(max_length=50, allow_blank=False)
