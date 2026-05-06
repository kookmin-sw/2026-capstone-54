from celery import current_app
from django.core.files.storage import default_storage
from interviews.enums import InterviewAnalysisReportStatus, TranscriptStatus
from interviews.models import InterviewAnalysisReport, InterviewTurn
from resumes.models import Resume
from resumes.services import UploadResumeBundleService


def get_resume_bundle_url(interview_session) -> str:
  if not interview_session.resume_id:
    return ""
  key = f"resume_bundles/{interview_session.resume_id}.json"
  if default_storage.exists(key):
    return default_storage.url(key)

  try:
    resume = Resume.objects.get(pk=interview_session.resume_id)
    return UploadResumeBundleService(resume=resume).perform()
  except Resume.DoesNotExist:
    return ""


def dispatch_report_task(report: InterviewAnalysisReport, bundle_url: str = "") -> None:
  current_app.send_task(
    "analysis.tasks.generate_report.generate_analysis_report",
    args=[report.pk],
    kwargs={"bundle_url": bundle_url},
    queue="analysis",
  )


def transcripts_pending(interview_session) -> bool:
  """세션의 STT 가 아직 진행 중인 turn 이 있는지 여부."""
  return InterviewTurn.objects.filter(
    interview_session=interview_session,
    transcript_status__in=[TranscriptStatus.PENDING, TranscriptStatus.PROCESSING],
  ).exists()


def face_analysis_pending(interview_session) -> bool:
  """세션의 face_analysis가 아직 완료되지 않은 recording이 있는지 여부."""
  from interviews.models import InterviewRecording
  return InterviewRecording.objects.filter(
    interview_session=interview_session,
    face_analysis_result={},
  ).exists()


def dispatch_report_if_ready(report: InterviewAnalysisReport) -> bool:
  """STT 가 모두 완료된 경우에만 LLM 분석을 dispatch 한다.

    동시 호출 (사용자 수동 trigger + STT 콜백 자동 trigger) 의 race 를 막기 위해
    PENDING → GENERATING 의 atomic update 한 번만 성공한 호출에서만 dispatch.

    반환: dispatch 했으면 True, 보류했으면 False.
    """
  if transcripts_pending(report.interview_session):
    return False
  if face_analysis_pending(report.interview_session):
    return False

  updated = InterviewAnalysisReport.objects.filter(
    pk=report.pk,
    interview_analysis_report_status=InterviewAnalysisReportStatus.PENDING,
  ).update(interview_analysis_report_status=InterviewAnalysisReportStatus.GENERATING)
  if not updated:
    return False

  bundle_url = get_resume_bundle_url(report.interview_session)
  dispatch_report_task(report, bundle_url=bundle_url)
  return True


def regenerate_analysis_report(report: InterviewAnalysisReport) -> None:
  report.interview_analysis_report_status = InterviewAnalysisReportStatus.PENDING
  report.error_message = ""
  report.overall_score = None
  report.overall_grade = ""
  report.overall_comment = ""
  report.category_scores = []
  report.question_feedbacks = []
  report.strengths = []
  report.improvement_areas = []
  report.save(
    update_fields=[
      "interview_analysis_report_status",
      "error_message",
      "overall_score",
      "overall_grade",
      "overall_comment",
      "category_scores",
      "question_feedbacks",
      "strengths",
      "improvement_areas",
      "updated_at",
    ]
  )
  bundle_url = get_resume_bundle_url(report.interview_session)
  dispatch_report_task(report, bundle_url=bundle_url)
