from rest_framework import serializers


class SubmitAnswerSerializer(serializers.Serializer):
  answer = serializers.CharField(min_length=1, max_length=5000)
  speech_segments = serializers.ListField(
    child=serializers.DictField(),
    required=False,
    default=list,
  )
  fallback_requested = serializers.BooleanField(required=False, default=False)
  recording_uuid = serializers.UUIDField(required=False, allow_null=True, default=None)
