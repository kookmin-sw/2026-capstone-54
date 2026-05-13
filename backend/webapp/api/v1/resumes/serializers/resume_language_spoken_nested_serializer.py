"""구조화 이력서 생성 시 languages_spoken[*] 를 nested 로 받는 serializer."""

from rest_framework import serializers
from resumes.models import ResumeLanguageSpoken


class ResumeLanguageSpokenNestedSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeLanguageSpoken
    fields = ["language", "level", "display_order"]
    extra_kwargs = {
      "language": {
        "required": False,
        "allow_blank": True
      },
      "level": {
        "required": False,
        "allow_blank": True
      },
      "display_order": {
        "required": False,
        "default": 0
      },
    }
