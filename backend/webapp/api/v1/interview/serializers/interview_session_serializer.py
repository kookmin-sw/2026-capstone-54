from interview.models import InterviewSession
from rest_framework import serializers


class InterviewSessionCreateSerializer(serializers.ModelSerializer):

  class Meta:
    model = InterviewSession
    fields = ["model_name", "is_auto", "difficulty_level"]


class InterviewSessionUpdateSerializer(serializers.ModelSerializer):

  class Meta:
    model = InterviewSession
    fields = ["total_input_tokens", "total_output_tokens", "total_tokens", "total_cost_usd", "difficulty_level"]


class InterviewSessionSerializer(serializers.ModelSerializer):

  class Meta:
    model = InterviewSession
    fields = [
      "id",
      "model_name",
      "is_auto",
      "difficulty_level",
      "total_input_tokens",
      "total_output_tokens",
      "total_tokens",
      "total_cost_usd",
      "created_at",
    ]
