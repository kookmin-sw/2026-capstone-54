"""구조화 이력서 생성 시 educations[*] 를 nested 로 받는 serializer."""

from rest_framework import serializers
from resumes.models import ResumeEducation


class ResumeEducationNestedSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeEducation
    fields = ["school", "degree", "major", "period", "display_order"]
    extra_kwargs = {
      "school": {
        "required": False,
        "allow_blank": True
      },
      "degree": {
        "required": False,
        "allow_blank": True
      },
      "major": {
        "required": False,
        "allow_blank": True
      },
      "period": {
        "required": False,
        "allow_blank": True
      },
      "display_order": {
        "required": False,
        "default": 0
      },
    }
