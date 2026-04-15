"""구조화 이력서 생성 시 certifications[*] 를 nested 로 받는 serializer."""

from rest_framework import serializers
from resumes.models import ResumeCertification


class ResumeCertificationNestedSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeCertification
    fields = ["name", "issuer", "date", "display_order"]
    extra_kwargs = {
      "name": {
        "required": False,
        "allow_blank": True
      },
      "issuer": {
        "required": False,
        "allow_blank": True
      },
      "date": {
        "required": False,
        "allow_blank": True
      },
      "display_order": {
        "required": False,
        "default": 0
      },
    }
