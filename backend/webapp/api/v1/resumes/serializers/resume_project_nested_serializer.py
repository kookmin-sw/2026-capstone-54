"""구조화 이력서 생성 시 projects[*] 를 nested 로 받는 serializer.

`tech_stack` 은 ModelField 가 아닌 write-only 문자열 배열로 받고,
`create()` 오버라이드에서 canonical TechStack 정규화 + ResumeProjectTechStack 생성을 처리한다.
"""

from rest_framework import serializers
from resumes.models import ResumeProject, ResumeProjectTechStack, TechStack


class ResumeProjectNestedSerializer(serializers.ModelSerializer):
  tech_stack = serializers.ListField(
    child=serializers.CharField(allow_blank=True),
    required=False,
    write_only=True,
  )

  class Meta:
    model = ResumeProject
    fields = ["name", "role", "period", "description", "display_order", "tech_stack"]
    extra_kwargs = {
      "name": {
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
      "description": {
        "required": False,
        "allow_blank": True
      },
      "display_order": {
        "required": False,
        "default": 0
      },
    }

  def create(self, validated_data):
    tech_names = validated_data.pop("tech_stack", []) or []
    instance = super().create(validated_data)
    for idx, name in enumerate(tech_names):
      tech = TechStack.get_or_create_normalized(name)
      if tech is None:
        continue
      ResumeProjectTechStack.objects.create(
        resume_project=instance,
        tech_stack=tech,
        display_order=idx,
      )
    return instance
