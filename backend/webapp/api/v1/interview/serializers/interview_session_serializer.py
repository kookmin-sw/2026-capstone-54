from interview.models import InterviewSession
from rest_framework import serializers


class InterviewSessionCreateSerializer(serializers.ModelSerializer):

  class Meta:
    model = InterviewSession
    fields = [
      "model_name",
      "is_auto",
      "difficulty_level",
      "resume_file",
      "job_posting_file",
      "total_chunks_retrieved",
      "total_initial_questions",
    ]


class InterviewSessionUpdateSerializer(serializers.ModelSerializer):

  class Meta:
    model = InterviewSession
    fields = [
      "total_input_tokens",
      "total_output_tokens",
      "total_tokens",
      "total_cost_usd",
      "difficulty_level",
      "status",
      "started_at",
      "finished_at",
      "duration_seconds",
      "total_initial_questions",
      "total_followup_questions",
      "avg_answer_length",
      "resume_file",
      "job_posting_file",
      "total_chunks_retrieved",
    ]


class InterviewSessionSerializer(serializers.ModelSerializer):

  class Meta:
    model = InterviewSession
    fields = [
      "id",
      "model_name",
      "is_auto",
      "difficulty_level",
      "status",
      "started_at",
      "finished_at",
      "duration_seconds",
      "total_initial_questions",
      "total_followup_questions",
      "avg_answer_length",
    ]
