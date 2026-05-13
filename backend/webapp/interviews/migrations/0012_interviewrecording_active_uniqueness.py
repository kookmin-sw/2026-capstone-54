from django.db import migrations, models

_ACTIVE_STATUSES = ["initiated", "uploading", "completed", "processing", "ready", "failed"]


def cleanup_duplicate_active_recordings(apps, schema_editor):
  InterviewRecording = apps.get_model("interviews", "InterviewRecording")

  from django.db.models import Count

  duplicate_groups = (
    InterviewRecording.objects.filter(status__in=_ACTIVE_STATUSES).values(
      "interview_turn_id",
      "media_type",
    ).annotate(cnt=Count("pk")).filter(cnt__gt=1)
  )

  for group in duplicate_groups:
    recordings_to_abandon = list(
      InterviewRecording.objects.filter(
        interview_turn_id=group["interview_turn_id"],
        media_type=group["media_type"],
        status__in=_ACTIVE_STATUSES,
      ).order_by("-created_at").values_list("pk", flat=True)[1:]
    )
    if recordings_to_abandon:
      InterviewRecording.objects.filter(pk__in=recordings_to_abandon).update(status="abandoned")


def noop(apps, schema_editor):
  pass


class Migration(migrations.Migration):

  dependencies = [
    ("interviews", "0011_interviewsession_audio_video_analysis_comment"),
  ]

  operations = [
    migrations.RunPython(cleanup_duplicate_active_recordings, noop),
    migrations.AddIndex(
      model_name="interviewrecording",
      index=models.Index(fields=["s3_key"], name="ir_s3_key_idx"),
    ),
    migrations.AddIndex(
      model_name="interviewrecording",
      index=models.Index(
        fields=["interview_session", "interview_turn", "status"],
        name="ir_session_turn_status_idx",
      ),
    ),
    migrations.AddConstraint(
      model_name="interviewrecording",
      constraint=models.UniqueConstraint(
        fields=["interview_turn", "media_type"],
        condition=~models.Q(status="abandoned"),
        name="uniq_active_recording_per_turn_media",
      ),
    ),
  ]
