from rest_framework import serializers
from resumes.models import Resume


class ResumeSerializer(serializers.ModelSerializer):
  """이력서 응답 직렬화 (목록/생성 응답 공용)."""

  resume_job_category = serializers.SerializerMethodField()

  class Meta:
    model = Resume
    fields = [
      "uuid",
      "type",
      "source_mode",
      "title",
      "is_active",
      "is_parsed",
      "is_dirty",
      "last_finalized_at",
      "analysis_status",
      "analysis_step",
      "analyzed_at",
      "created_at",
      "updated_at",
      "resume_job_category",
    ]
    read_only_fields = fields

  def get_resume_job_category(self, obj: Resume) -> dict | None:
    if not obj.resume_job_category_id:
      return None
    cat = obj.resume_job_category
    return {"uuid": str(cat.uuid), "name": cat.name, "emoji": cat.emoji}
