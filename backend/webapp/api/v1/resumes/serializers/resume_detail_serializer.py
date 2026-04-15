"""이력서 상세 조회 응답 직렬화.

정규화 sub-model 을 `ResumeParsedDataReader` 로 조립해 `parsed_data` dict 로 노출한다.
구조화/섹션 편집 플로우에 필요한 메타 (source_mode / is_dirty / last_finalized_at /
resume_job_category) 도 함께 포함한다. CamelCaseJSONRenderer 가 camelCase 로 자동 변환.
"""

from django.core.files.storage import default_storage
from rest_framework import serializers
from resumes.models import Resume
from resumes.services.resume_parsed_data_reader import ResumeParsedDataReader


class ResumeDetailSerializer(serializers.ModelSerializer):
  """이력서 상세 조회 응답. parsed_data + 원본 콘텐츠 + 메타."""

  parsed_data = serializers.SerializerMethodField()
  resume_job_category = serializers.SerializerMethodField()

  content = serializers.SerializerMethodField()
  original_filename = serializers.SerializerMethodField()
  file_size_bytes = serializers.SerializerMethodField()
  mime_type = serializers.SerializerMethodField()
  file_text_content = serializers.SerializerMethodField()
  file_url = serializers.SerializerMethodField()

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
      "parsed_data",
      "resume_job_category",
      "content",
      "original_filename",
      "file_size_bytes",
      "mime_type",
      "file_text_content",
      "file_url",
    ]
    read_only_fields = fields

  # ── parsed_data / FK ────────────────────────────────────────────────────

  def get_parsed_data(self, obj: Resume) -> dict | None:
    return ResumeParsedDataReader(obj).build_or_fallback()

  def get_resume_job_category(self, obj: Resume) -> dict | None:
    if not obj.resume_job_category_id:
      return None
    cat = obj.resume_job_category
    return {"uuid": str(cat.uuid), "name": cat.name, "emoji": cat.emoji}

  # ── text 모드 원본 ──────────────────────────────────────────────────────

  def get_content(self, obj: Resume) -> str | None:
    try:
      return obj.text_content.content
    except Resume.text_content.RelatedObjectDoesNotExist:
      return None

  # ── file 모드 메타/원본 ────────────────────────────────────────────────

  def _file_content(self, obj: Resume):
    try:
      return obj.file_content
    except Resume.file_content.RelatedObjectDoesNotExist:
      return None

  def get_original_filename(self, obj: Resume) -> str | None:
    fc = self._file_content(obj)
    return fc.original_filename if fc else None

  def get_file_size_bytes(self, obj: Resume) -> int | None:
    fc = self._file_content(obj)
    return fc.file_size_bytes if fc else None

  def get_mime_type(self, obj: Resume) -> str | None:
    fc = self._file_content(obj)
    return fc.mime_type if fc else None

  def get_file_text_content(self, obj: Resume) -> str | None:
    fc = self._file_content(obj)
    return fc.content if fc else None

  def get_file_url(self, obj: Resume) -> str | None:
    fc = self._file_content(obj)
    if not fc or not fc.storage_path:
      return None
    try:
      return default_storage.url(fc.storage_path)
    except Exception:
      return None
