from rest_framework import serializers
from resumes.models import ResumeTextContentTemplate


class ResumeTextContentTemplateListSerializer(serializers.ModelSerializer):
  """목록 응답: 라벨 구성에 필요한 최소 정보만 반환한다.

  목록에서는 content/preview 를 제공하지 않으며, 상세 API로 본문을 가져온다.
  """

  job = serializers.SerializerMethodField()

  class Meta:
    model = ResumeTextContentTemplate
    fields = ["uuid", "title", "display_order", "job"]
    read_only_fields = fields

  def get_job(self, obj: ResumeTextContentTemplate) -> dict:
    return {
      "id": str(obj.job_id),
      "name": obj.job.name,
      "category": obj.job.category.name if obj.job.category_id else None,
    }
