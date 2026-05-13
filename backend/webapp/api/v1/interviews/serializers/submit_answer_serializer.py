from rest_framework import serializers


class SubmitAnswerSerializer(serializers.Serializer):
  answer = serializers.CharField(allow_blank=True, max_length=5000, default="")
  speech_segments = serializers.ListField(
    child=serializers.DictField(),
    required=False,
    default=list,
  )
  gaze_away_count = serializers.IntegerField(required=False, min_value=0, default=0)
  head_away_count = serializers.IntegerField(required=False, min_value=0, default=0)
  speech_rate_sps = serializers.FloatField(required=False, min_value=0.0, allow_null=True, default=None)
  pillar_word_counts = serializers.DictField(
    child=serializers.IntegerField(min_value=0),
    required=False,
    default=dict,
  )
