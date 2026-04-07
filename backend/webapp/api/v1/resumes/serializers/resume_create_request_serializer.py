from rest_framework import serializers
from resumes.enums import ResumeType


class ResumeCreateRequestSerializer(serializers.Serializer):
  """통합 이력서 생성 요청 직렬화."""

  type = serializers.ChoiceField(choices=ResumeType.choices)
  title = serializers.CharField(max_length=255)
  content = serializers.CharField(required=False)
  file = serializers.FileField(required=False)

  def validate(self, attrs):
    resume_type = attrs.get("type")

    if resume_type == ResumeType.TEXT and not attrs.get("content"):
      raise serializers.ValidationError({"content": "텍스트 이력서는 content 필드가 필수입니다."})

    if resume_type == ResumeType.FILE and not attrs.get("file"):
      raise serializers.ValidationError({"file": "파일 이력서는 file 필드가 필수입니다."})

    return attrs
