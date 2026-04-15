"""구조화 이력서 생성 시 experiences[*] 를 nested 로 받는 serializer."""

from rest_framework import serializers
from resumes.models import ResumeExperience


class ResumeExperienceNestedSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeExperience
    fields = [
      "company",
      "role",
      "period",
      "responsibilities",
      "highlights",
      "display_order",
    ]
    extra_kwargs = {
      "company": {
        "required": False,
        "allow_blank": True
      },
      "role": {
        "required": False,
        "allow_blank": True
      },
      "period": {
        "required": False,
        "allow_blank": True
      },
      "responsibilities": {
        "required": False
      },
      "highlights": {
        "required": False
      },
      "display_order": {
        "required": False,
        "default": 0
      },
    }
