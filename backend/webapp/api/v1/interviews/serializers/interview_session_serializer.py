"""면접 세션 Serializer."""

from interviews.constants import MAX_FOLLOWUP_PER_ANCHOR
from interviews.enums import InterviewSessionType
from interviews.models import InterviewSession
from rest_framework import serializers


class InterviewSessionSerializer(serializers.ModelSerializer):
  estimated_total_questions = serializers.SerializerMethodField()

  class Meta:
    model = InterviewSession
    fields = (
      "uuid",
      "interview_session_type",
      "interview_session_status",
      "interview_difficulty_level",
      "interview_practice_mode",
      "total_questions",
      "total_followup_questions",
      "estimated_total_questions",
      "created_at",
      "updated_at",
    )
    read_only_fields = fields

  def get_estimated_total_questions(self, obj):
    if obj.interview_session_type == InterviewSessionType.FOLLOWUP:
      return obj.total_questions * (1 + MAX_FOLLOWUP_PER_ANCHOR)
    return obj.total_questions
