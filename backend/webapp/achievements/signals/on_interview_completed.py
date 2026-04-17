"""면접 참여 완료 시 업적 평가를 트리거한다."""

from achievements.constants import TRIGGER_KEY_INTERVIEW_COMPLETED, TRIGGER_TYPE_EVENT
from achievements.tasks import enqueue_evaluate_achievements_task
from django.dispatch import receiver
from streaks.signals import interview_completed


@receiver(interview_completed, dispatch_uid="achievements.on_interview_completed")
def on_interview_completed(sender, user, **kwargs):
  enqueue_evaluate_achievements_task(
    user_id=user.id,
    trigger_type=TRIGGER_TYPE_EVENT,
    trigger_key=TRIGGER_KEY_INTERVIEW_COMPLETED,
    context={},
  )
