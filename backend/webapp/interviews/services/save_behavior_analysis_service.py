from common.services import BaseService
from interviews.enums import BehaviorAnalysisStatus
from interviews.models import InterviewBehaviorAnalysis, InterviewSession, InterviewTurn


class SaveBehaviorAnalysisService(BaseService):
  required_value_kwargs = ["session_uuid", "turn_id", "analysis_type"]

  def validate(self):
    analysis_type = self.kwargs["analysis_type"]
    if analysis_type not in ("expression", "speech"):
      from django.core.exceptions import ValidationError

      raise ValidationError({"analysis_type": "expression 또는 speech 여야 합니다."})

  def execute(self):
    session = self.get_or_404(
      InterviewSession,
      pk=self.kwargs["session_uuid"],
    )
    turn = self.get_or_404(
      InterviewTurn,
      pk=self.kwargs["turn_id"],
      interview_session=session,
    )

    analysis, _ = InterviewBehaviorAnalysis.objects.get_or_create(
      interview_session=session,
      interview_turn=turn,
      defaults={
        "user": session.user,
        "status": BehaviorAnalysisStatus.PENDING,
      },
    )

    analysis = InterviewBehaviorAnalysis.objects.select_for_update().get(pk=analysis.pk)

    analysis_type = self.kwargs["analysis_type"]
    data = self.kwargs.get("data", {})

    if analysis_type == "expression":
      analysis.expression_data = data
    else:
      analysis.speech_data = data

    if analysis.expression_data and analysis.speech_data:
      analysis.status = BehaviorAnalysisStatus.COMPLETED
    else:
      analysis.status = BehaviorAnalysisStatus.PROCESSING

    update_fields = [analysis_type + "_data", "status"]
    analysis.save(update_fields=update_fields)

    return analysis
