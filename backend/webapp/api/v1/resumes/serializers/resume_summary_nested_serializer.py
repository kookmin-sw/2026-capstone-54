"""구조화 이력서 생성 시 summary 를 nested 로 받는 serializer."""

from rest_framework import serializers
from resumes.models import ResumeSummary


class ResumeSummaryNestedSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeSummary
    fields = ["text"]
    extra_kwargs = {"text": {"required": False, "allow_blank": True}}
