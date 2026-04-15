"""구조화 이력서 생성 시 basic_info 를 nested 로 받는 serializer."""

from rest_framework import serializers
from resumes.models import ResumeBasicInfo


class ResumeBasicInfoNestedSerializer(serializers.ModelSerializer):

  class Meta:
    model = ResumeBasicInfo
    fields = ["name", "email", "phone", "location"]
    extra_kwargs = {
      "name": {
        "required": False,
        "allow_blank": True
      },
      "email": {
        "required": False,
        "allow_blank": True
      },
      "phone": {
        "required": False,
        "allow_blank": True
      },
      "location": {
        "required": False,
        "allow_blank": True
      },
    }
