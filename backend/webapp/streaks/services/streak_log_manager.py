from django.db import transaction
from django.db.models import F
from django.utils import timezone
from streaks.models import StreakLog


class StreakLogManager:
  """StreakLog 생성 및 카운트 증가만 담당."""

  def __init__(self, user):
    self.user = user

  def increment(self):
    today = timezone.localdate()

    with transaction.atomic():
      log, created = StreakLog.objects.select_for_update().get_or_create(
        user=self.user,
        date=today,
        defaults={"interview_results_count": 0},
      )

      if created:
        log.interview_results_count = 1
      else:
        log.interview_results_count = F("interview_results_count") + 1

      log.save(update_fields=["interview_results_count", "updated_at"])
      log.refresh_from_db()

    return log
