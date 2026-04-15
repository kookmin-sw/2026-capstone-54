"""구조화 이력서 생성 시 career_meta 를 nested 로 받는 serializer."""

from rest_framework import serializers
from resumes.models import ResumeCareerMeta


class ResumeCareerMetaNestedSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeCareerMeta
    fields = ["total_experience_years", "total_experience_months"]
    extra_kwargs = {
      "total_experience_years": {
        "required": False,
        "allow_null": True,
        "min_value": 0
      },
      "total_experience_months": {
        "required": False,
        "allow_null": True,
        "min_value": 0,
        "max_value": 11,
      },
    }
