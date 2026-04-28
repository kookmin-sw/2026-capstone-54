"""사용자별 다중 활성 인터뷰 세션을 정리하는 데이터 마이그레이션."""
from django.db import migrations, transaction
from django.db.models import Count


def _dedupe(InterviewSession):
  """주어진 InterviewSession 모델로 사용자별 다중 활성 세션을 dedupe 한다."""
  duplicate_user_ids = (
    InterviewSession.objects.filter(interview_session_status__in=("in_progress", "paused")
                                    ).values("user_id").annotate(active_count=Count("pk")
                                                                 ).filter(active_count__gt=1
                                                                          ).values_list("user_id", flat=True)
  )

  for user_id in list(duplicate_user_ids):
    with transaction.atomic():
      sessions = list(
        InterviewSession.objects.select_for_update().filter(
          user_id=user_id, interview_session_status__in=("in_progress", "paused")
        ).order_by("-updated_at", "-created_at")
      )

      # 첫 번째(가장 최근)는 유지
      for stale in sessions[1:]:
        stale.interview_session_status = "completed"
        stale.save(update_fields=["interview_session_status", "updated_at"])


def forward(apps, schema_editor):
  """마이그레이션 정방향 적용."""
  InterviewSession = apps.get_model("interviews", "InterviewSession")
  _dedupe(InterviewSession)


def reverse(apps, schema_editor):
  """마이그레이션 역방향 적용. (no-op)"""
  pass


class Migration(migrations.Migration):
  """다중 활성 인터뷰 세션 정리 마이그레이션."""

  atomic = False

  dependencies = [
    ("interviews", "0007_add_pause_and_ownership_fields"),
  ]

  operations = [
    migrations.RunPython(forward, reverse),
  ]
