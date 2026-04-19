from django.contrib import admin
from interviews.models.interview_recording import InterviewRecording
from unfold.admin import ModelAdmin


@admin.register(InterviewRecording)
class InterviewRecordingAdmin(ModelAdmin):
  list_display = (
    "pk",
    "user__email",
    "media_type",
    "status",
    "duration_ms",
    "s3_bucket",
    "created_at",
  )
  list_filter = (
    "media_type",
    "status",
    "s3_bucket",
  )
  list_select_related = ("user", "interview_session", "interview_turn")
  search_fields = ("user__email", "s3_key")
  ordering = ("-created_at", )
  readonly_fields = ("pk", "created_at", "updated_at")

  fieldsets = (
    (
      None,
      {
        "fields": (
          "pk",
          "user",
          "interview_session",
          "interview_turn",
        ),
      },
    ),
    (
      "녹화 정보",
      {
        "fields": (
          "media_type",
          "status",
          "start_timestamp",
          "end_timestamp",
          "duration_ms",
        ),
      },
    ),
    (
      "S3 저장 정보",
      {
        "fields": (
          "s3_bucket",
          "s3_key",
          "upload_id",
        ),
      },
    ),
    (
      "후처리 결과",
      {
        "fields": (
          "scaled_video_key",
          "frame_prefix",
          "audio_key",
          "scaled_audio_key",
        ),
      },
    ),
    (
      "날짜",
      {
        "fields": (
          "created_at",
          "updated_at",
        ),
      },
    ),
  )
