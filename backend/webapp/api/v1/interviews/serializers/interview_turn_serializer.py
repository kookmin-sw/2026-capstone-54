"""면접 턴 Serializer."""

from interviews.models import InterviewTurn
from rest_framework import serializers


class InterviewTurnSerializer(serializers.ModelSerializer):
  """턴 응답 Serializer."""

  class Meta:
    model = InterviewTurn
    fields = (
      "id",
      "turn_type",
      "question_source",
      "question",
      "answer",
      "speech_segments",
      "turn_number",
      "followup_order",
      "gaze_away_count",
      "head_away_count",
      "speech_rate_sps",
      "pillar_word_counts",
      "created_at",
    )
    read_only_fields = fields
