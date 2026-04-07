from interview.models import AnalysisReport
from rest_framework import serializers


class ReportCreateResponseSerializer(serializers.Serializer):
  """POST 응답용: 리포트 생성 요청 결과."""

  report_id = serializers.IntegerField()
  status = serializers.CharField()


class ReportStatusSerializer(serializers.ModelSerializer):
  """generating 상태일 때 상태만 반환."""

  class Meta:
    model = AnalysisReport
    fields = ["id", "status"]


class ReportDetailSerializer(serializers.ModelSerializer):
  """GET 응답용: AnalysisReport 전체 필드 + 개요/요약 메타데이터."""

  # 개요/요약 섹션 - 세션 메타데이터
  started_at = serializers.DateTimeField(source="session.started_at", read_only=True)
  duration_seconds = serializers.IntegerField(source="session.duration_seconds", read_only=True)
  difficulty_level = serializers.CharField(source="session.difficulty_level", read_only=True)
  resume_file = serializers.CharField(source="session.resume_file", read_only=True)
  job_posting_file = serializers.CharField(source="session.job_posting_file", read_only=True)
  total_questions = serializers.SerializerMethodField()
  avg_answer_time = serializers.SerializerMethodField()
  avg_answer_length = serializers.IntegerField(source="session.avg_answer_length", read_only=True)

  class Meta:
    model = AnalysisReport
    fields = [
      "id",
      "session_id",
      "status",
      "error_message",
      # 개요/요약 메타데이터
      "started_at",
      "duration_seconds",
      "difficulty_level",
      "resume_file",
      "job_posting_file",
      "total_questions",
      "avg_answer_time",
      "avg_answer_length",
      # 종합 점수
      "overall_score",
      "overall_grade",
      "overall_comment",
      # 답변 평가
      "category_scores",
      # 질문별 피드백
      "question_feedbacks",
      # 강점 및 개선 영역
      "strengths",
      "improvement_areas",
      # 토큰 사용량
      "input_tokens",
      "output_tokens",
      "total_tokens",
      "total_cost_usd",
      # 타임스탬프
      "created_at",
    ]

  def get_total_questions(self, obj):
    """총 문항 개수 (초기 질문 수 + 꼬리질문 수)."""
    session = obj.session
    return session.total_initial_questions + session.total_followup_questions

  def get_avg_answer_time(self, obj):
    """평균 답변 시간 = 총 소요 시간 / 총 문항 개수."""
    session = obj.session
    total = session.total_initial_questions + session.total_followup_questions
    if not total or not session.duration_seconds:
      return 0
    return round(session.duration_seconds / total, 1)
