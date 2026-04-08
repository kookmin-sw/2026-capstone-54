from rest_framework import serializers


class ResumeUpdateSerializer(serializers.Serializer):
  """이력서 수정 요청 직렬화. PUT/PATCH 공용."""

  title = serializers.CharField(max_length=255, required=False)
  content = serializers.CharField(required=False)
  file = serializers.FileField(required=False)
