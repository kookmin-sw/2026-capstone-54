from rest_framework import serializers
from resumes.models import ResumeProject


class ResumeProjectResponseSerializer(serializers.ModelSerializer):
  tech_stack = serializers.SerializerMethodField()

  class Meta:
    model = ResumeProject
    fields = [
      "uuid",
      "name",
      "role",
      "period",
      "description",
      "tech_stack",
      "display_order",
      "created_at",
      "updated_at",
    ]
    read_only_fields = fields

  def get_tech_stack(self, obj: ResumeProject) -> list[str]:
    return [t.tech_stack.name for t in obj.resume_project_tech_stacks.select_related("tech_stack").all()]
