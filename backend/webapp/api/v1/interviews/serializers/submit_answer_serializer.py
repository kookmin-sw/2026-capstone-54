from rest_framework import serializers


class SubmitAnswerSerializer(serializers.Serializer):
  answer = serializers.CharField(allow_blank=True, max_length=5000, default="")
  speech_segments = serializers.ListField(
    child=serializers.DictField(),
    required=False,
    default=list,
  )
