from interviews.models import InterviewBehaviorAnalysis
from rest_framework import serializers


class BehaviorAnalysisSerializer(serializers.ModelSerializer):

  class Meta:
    model = InterviewBehaviorAnalysis
    fields = [
      "uuid",
      "interview_turn",
      "status",
      "speech_data",
      "expression_data",
    ]
    read_only_fields = fields
