from django.db.models.signals import post_save
from django.dispatch import receiver
from interviews.enums import BehaviorAnalysisStatus
from interviews.models import InterviewBehaviorAnalysis


@receiver(post_save, sender=InterviewBehaviorAnalysis)
def notify_behavior_analysis_completed(sender, instance, update_fields, **kwargs):
  if update_fields and "status" not in update_fields:
    return
  if instance.status != BehaviorAnalysisStatus.COMPLETED:
    return

  session = instance.interview_session
  user = session.user
  if user is None:
    return

  from notifications.services import CreateNotificationService

  CreateNotificationService(
    user=user,
    message="면접 행동 분석이 완료되었습니다. 결과를 확인해 보세요.",
    category="interview",
    notifiable=session,
  ).perform()
