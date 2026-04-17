from django.db.models.signals import post_save
from django.dispatch import receiver
from interviews.enums import InterviewAnalysisReportStatus
from interviews.models import InterviewAnalysisReport


@receiver(post_save, sender=InterviewAnalysisReport)
def notify_interview_report_completed(sender, instance, update_fields, **kwargs):
  """면접 분석 리포트 완료 시 해당 세션 사용자에게 알림을 발행한다."""
  if update_fields and "interview_analysis_report_status" not in update_fields:
    return
  if (instance.interview_analysis_report_status != InterviewAnalysisReportStatus.COMPLETED):
    return

  session = instance.interview_session
  user = session.user
  if user is None:
    return

  from notifications.services import CreateNotificationService

  CreateNotificationService(
    user=user,
    message="면접 리포트가 발행되었습니다. 결과를 확인해 보세요.",
    category="interview",
    notifiable=instance,
  ).perform()
