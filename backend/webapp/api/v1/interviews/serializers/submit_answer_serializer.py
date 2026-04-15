from rest_framework import serializers


class SubmitAnswerSerializer(serializers.Serializer):
  """답변 제출 요청 Serializer."""

  answer = serializers.CharField(min_length=1, max_length=5000)
