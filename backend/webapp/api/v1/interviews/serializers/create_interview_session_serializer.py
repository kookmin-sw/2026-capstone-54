"""면접 세션 생성 Serializer."""

from interviews.enums import InterviewDifficultyLevel, InterviewPracticeMode, InterviewSessionType
from rest_framework import serializers


class CreateInterviewSessionSerializer(serializers.Serializer):
  resume_uuid = serializers.UUIDField()
  user_job_description_uuid = serializers.UUIDField()

  interview_session_type = serializers.ChoiceField(choices=InterviewSessionType.choices)
  interview_difficulty_level = serializers.ChoiceField(
    choices=InterviewDifficultyLevel.choices,
    default=InterviewDifficultyLevel.NORMAL,
  )
  interview_practice_mode = serializers.ChoiceField(
    choices=InterviewPracticeMode.choices,
    default=InterviewPracticeMode.PRACTICE,
  )
