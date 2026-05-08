"""분석 리포트 Serializer."""

from interviews.models import InterviewAnalysisReport
from rest_framework import serializers


class InterviewAnalysisReportSerializer(serializers.ModelSerializer):
  # 면접 개요 (InterviewSession 및 관계 모델에서 조회)
  company_name = serializers.SerializerMethodField()
  position_title = serializers.SerializerMethodField()
  interview_date = serializers.SerializerMethodField()
  duration_seconds = serializers.SerializerMethodField()
  difficulty_level = serializers.SerializerMethodField()
  total_questions = serializers.SerializerMethodField()
  total_followup_questions = serializers.SerializerMethodField()

  class Meta:
    model = InterviewAnalysisReport
    fields = (
      "id",
      "interview_analysis_report_status",
      "overall_score",
      "overall_grade",
      "overall_comment",
      "category_scores",
      "question_feedbacks",
      "strengths",
      "improvement_areas",
      "error_message",
      "created_at",
      "updated_at",
      # 컴포넌트 점수
      "content_score",
      "video_score",
      "audio_score",
      # 영상 분석
      "video_analysis_result",
      "video_analysis_comment",
      # 음성 분석
      "audio_analysis_result",
      "audio_analysis_comment",
      # 면접 개요
      "company_name",
      "position_title",
      "interview_date",
      "duration_seconds",
      "difficulty_level",
      "total_questions",
      "total_followup_questions",
    )
    read_only_fields = fields

  def _get_session(self, obj):
    return getattr(obj, "interview_session", None)

  def get_company_name(self, obj):
    session = self._get_session(obj)
    if session and session.user_job_description:
      return getattr(session.user_job_description.job_description, "company", "") or ""
    return ""

  def get_position_title(self, obj):
    session = self._get_session(obj)
    if session and session.user_job_description:
      return getattr(session.user_job_description.job_description, "title", "") or ""
    return ""

  def get_interview_date(self, obj):
    session = self._get_session(obj)
    if session:
      return session.created_at.isoformat() if session.created_at else None
    return None

  def get_duration_seconds(self, obj):
    session = self._get_session(obj)
    if session and session.created_at and session.updated_at:
      delta = session.updated_at - session.created_at
      return int(delta.total_seconds())
    return None

  def get_difficulty_level(self, obj):
    session = self._get_session(obj)
    if session:
      return session.interview_difficulty_level
    return ""

  def get_total_questions(self, obj):
    session = self._get_session(obj)
    if session:
      return session.total_questions
    return 0

  def get_total_followup_questions(self, obj):
    session = self._get_session(obj)
    if session:
      return session.total_followup_questions
    return 0
