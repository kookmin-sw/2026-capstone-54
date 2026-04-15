from rest_framework import serializers
from resumes.models import ResumeTextContentTemplate


class ResumeTextContentTemplateDetailSerializer(serializers.ModelSerializer):
  """상세 응답: 전체 content 포함."""

  job = serializers.SerializerMethodField()

  class Meta:
    model = ResumeTextContentTemplate
    fields = ["uuid", "title", "display_order", "job", "content", "created_at", "updated_at"]
    read_only_fields = fields

  def get_job(self, obj: ResumeTextContentTemplate) -> dict:
    return {
      "id": str(obj.job_id),
      "name": obj.job.name,
      "category": obj.job.category.name if obj.job.category_id else None,
    }
