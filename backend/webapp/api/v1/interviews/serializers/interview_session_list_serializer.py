"""면접 결과 목록용 직렬화기."""

from interviews.enums import InterviewExchangeType
from interviews.models import InterviewSession
from rest_framework import serializers


class InterviewSessionListSerializer(serializers.ModelSerializer):
  """면접 결과 목록 항목. resume·UJD·앵커 질문·리포트 상태를 포함한다."""

  resume_title = serializers.SerializerMethodField()
  job_description_label = serializers.SerializerMethodField()
  anchor_questions = serializers.SerializerMethodField()
  report_status = serializers.SerializerMethodField()

  class Meta:
    model = InterviewSession
    fields = (
      "uuid",
      "interview_session_type",
      "interview_session_status",
      "interview_difficulty_level",
      "total_questions",
      "total_followup_questions",
      "created_at",
      "resume_title",
      "job_description_label",
      "anchor_questions",
      "report_status",
    )
    read_only_fields = fields

  def get_resume_title(self, obj: InterviewSession) -> str:
    if obj.resume:
      return obj.resume.title
    return "삭제된 이력서"

  def get_job_description_label(self, obj: InterviewSession) -> str:
    ujd = obj.user_job_description
    if ujd and ujd.job_description:
      jd = ujd.job_description
      company = jd.company or ""
      title = jd.title or ""
      return (f"{company} — {title}".strip(" —") if (company or title) else "채용공고")
    return "삭제된 채용공고"

  def get_anchor_questions(self, obj: InterviewSession) -> list[dict]:
    # prefetch_related("initial_turns")로 미리 로드된 값을 사용한다.
    turns = getattr(obj, "_prefetched_initial_turns", None)
    if turns is None:
      turns = obj.turns.filter(turn_type=InterviewExchangeType.INITIAL).order_by("turn_number")
    return [{"id": t.pk, "question": t.question} for t in turns]

  def get_report_status(self, obj: InterviewSession) -> str | None:
    try:
      return obj.analysis_report.interview_analysis_report_status
    except Exception:
      return None
