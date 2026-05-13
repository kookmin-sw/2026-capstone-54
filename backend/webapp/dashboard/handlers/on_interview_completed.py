"""면접 완료 시 사용자 연습 시간 통계를 비동기로 재계산한다."""

from dashboard.tasks import enqueue_recalculate_practice_time_task
from django.db import transaction
from django.dispatch import receiver
from streaks.signals import interview_completed


@receiver(interview_completed, dispatch_uid="dashboard.on_interview_completed")
def on_interview_completed(sender, user, **kwargs):
  transaction.on_commit(lambda: enqueue_recalculate_practice_time_task(user_id=user.id))
