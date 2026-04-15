"""면접 세션 Serializer."""

from interviews.models import InterviewSession
from rest_framework import serializers


class InterviewSessionSerializer(serializers.ModelSerializer):

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
      "created_at",
      "updated_at",
    )
    read_only_fields = fields
