from interview.models import InterviewExchange
from rest_framework import serializers


class InterviewExchangeCreateSerializer(serializers.ModelSerializer):
  class Meta:
    model = InterviewExchange
    fields = ["session", "exchange_type", "depth", "question", "answer", "input_tokens", "output_tokens", "total_tokens"]


class InterviewExchangeSerializer(serializers.ModelSerializer):
  class Meta:
    model = InterviewExchange
    fields = [
      "id", "session", "exchange_type", "depth",
      "question", "answer",
      "input_tokens", "output_tokens", "total_tokens",
      "created_at",
    ]
