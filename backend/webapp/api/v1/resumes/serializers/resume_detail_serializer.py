from rest_framework import serializers
from resumes.models import Resume


class ResumeDetailSerializer(serializers.ModelSerializer):
  """이력서 상세 조회 응답 직렬화. 기본 필드 + 타입별 상세 정보 포함."""

  content = serializers.SerializerMethodField()
  original_filename = serializers.SerializerMethodField()
  file_size_bytes = serializers.SerializerMethodField()

  class Meta:
    model = Resume
    fields = [
      "uuid",
      "type",
      "title",
      "is_active",
      "analysis_status",
      "analysis_step",
      "analyzed_at",
      "created_at",
      "updated_at",
      "content",
      "original_filename",
      "file_size_bytes",
    ]
    read_only_fields = fields

  def get_content(self, obj: Resume) -> str | None:
    """텍스트 이력서의 본문 내용을 반환한다."""
    try:
      return obj.text_content.content
    except Resume.text_content.RelatedObjectDoesNotExist:
      return None

  def get_original_filename(self, obj: Resume) -> str | None:
    """파일 이력서의 원본 파일명을 반환한다."""
    try:
      return obj.file_content.original_filename
    except Resume.file_content.RelatedObjectDoesNotExist:
      return None

  def get_file_size_bytes(self, obj: Resume) -> int | None:
    """파일 이력서의 파일 크기(바이트)를 반환한다."""
    try:
      return obj.file_content.file_size_bytes
    except Resume.file_content.RelatedObjectDoesNotExist:
      return None
