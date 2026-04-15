"""구조화 이력서 생성 시 awards[*] 를 nested 로 받는 serializer."""

from rest_framework import serializers
from resumes.models import ResumeAward


class ResumeAwardNestedSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeAward
    fields = ["name", "year", "organization", "description", "display_order"]
    extra_kwargs = {
      "name": {
        "required": False,
        "allow_blank": True
      },
      "year": {
        "required": False,
        "allow_blank": True
      },
      "organization": {
        "required": False,
        "allow_blank": True
      },
      "description": {
        "required": False,
        "allow_blank": True
      },
      "display_order": {
        "required": False,
        "default": 0
      },
    }
