from django.conf import settings
from django.contrib import admin
from django.http import HttpRequest
from django.shortcuts import redirect
from django.urls import reverse_lazy
from interviews.models import InterviewRecording
from interviews.models.interview_turn import InterviewTurn
from interviews.tasks.process_video_step_complete import _dispatch_transcribe_audio
from unfold.admin import ModelAdmin
from unfold.decorators import action


@admin.register(InterviewTurn)
class InterviewTurnAdmin(ModelAdmin):
  list_display = (
    "pk",
    "interview_session_id",
    "turn_type",
    "question_source",
    "turn_number",
    "has_answer",
    "gaze_away_count",
    "head_away_count",
    "speech_rate_sps_display",
    "transcript_status",
    "transcript_source",
    "created_at",
  )
  list_filter = (
    "turn_type",
    "question_source",
    "transcript_status",
    "transcript_source",
  )
  list_select_related = ("interview_session", )
  search_fields = ("question", "answer", "transcript_text", "interview_session__user__email")
  ordering = ("-created_at", )
  readonly_fields = ("pk", "created_at", "updated_at", "pillar_words_summary")
  actions = ["bulk_redispatch_transcribes"]
  actions_row = ["redispatch_transcribe"]

  fieldsets = (
    (
      None, {
        "fields": (
          "pk",
          "interview_session",
          "turn_type",
          "question_source",
          "turn_number",
          "followup_order",
        ),
      }
    ),
    ("내용", {
      "fields": (
        "question",
        "answer",
      ),
    }),
    (
      "행동/발화 메트릭", {
        "fields": (
          "gaze_away_count",
          "head_away_count",
          "speech_rate_sps",
          "pillar_words_summary",
          "pillar_word_counts",
        ),
      }
    ),
    (
      "STT (백엔드 음성 인식 결과)", {
        "fields": (
          "transcript_status",
          "transcript_source",
          "transcript_error_code",
          "transcript_text",
          "speech_segments",
        ),
      }
    ),
    ("날짜", {
      "fields": (
        "created_at",
        "updated_at",
      ),
    }),
  )

  @admin.display(boolean=True, description="답변 여부")
  def has_answer(self, obj: InterviewTurn) -> bool:
    return bool(obj.answer)

  @admin.display(description="발화 속도(음절/초)", ordering="speech_rate_sps")
  def speech_rate_sps_display(self, obj: InterviewTurn) -> str:
    if obj.speech_rate_sps is None:
      return "—"
    return f"{obj.speech_rate_sps:.2f}"

  @admin.display(description="필러 단어 요약")
  def pillar_words_summary(self, obj: InterviewTurn) -> str:
    counts: dict = obj.pillar_word_counts or {}
    if not counts:
      return "—"
    sorted_items = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
    head = ", ".join(f"{word}({count})" for word, count in sorted_items[:3])
    remaining = len(sorted_items) - 3
    if remaining > 0:
      return f"{head} 외 {remaining}종"
    return head

  @admin.action(description="선택한 턴 STT 재생성 (analysis-stt 재dispatch)")
  def bulk_redispatch_transcribes(self, request: HttpRequest, queryset):
    dispatched, skipped = self._redispatch_for_turns(queryset)
    self.message_user(
      request,
      f"STT 재생성 dispatch: 성공 {dispatched}건, 스킵 {skipped}건 (audio_key 부재 또는 recording 없음).",
    )

  @action(description="STT 재생성", url_path="redispatch-transcribe")
  def redispatch_transcribe(self, request: HttpRequest, object_id: int):
    queryset = InterviewTurn.objects.filter(pk=object_id)
    dispatched, skipped = self._redispatch_for_turns(queryset)
    if dispatched:
      self.message_user(request, f"턴 #{object_id} STT 재생성 dispatch 완료.")
    else:
      self.message_user(
        request,
        f"턴 #{object_id} dispatch 스킵 (audio_key 부재 또는 recording 없음).",
        level="warning",
      )
    return redirect(reverse_lazy("admin:interviews_interviewturn_changelist"))

  def has_redispatch_transcribe_permission(self, request: HttpRequest) -> bool:
    return request.user.is_staff

  @staticmethod
  def _redispatch_for_turns(queryset) -> tuple[int, int]:
    audio_bucket = settings.AUDIO_S3_BUCKET

    recordings = InterviewRecording.objects.filter(interview_turn__in=queryset, ).only("interview_turn_id", "audio_key")
    recording_map = {r.interview_turn_id: r.audio_key for r in recordings}

    dispatched = 0
    skipped = 0
    for turn in queryset:
      audio_key = recording_map.get(turn.id)
      if not audio_key:
        skipped += 1
        continue
      _dispatch_transcribe_audio(
        turn_id=str(turn.id),
        output_bucket=audio_bucket,
        output_key=audio_key,
      )
      dispatched += 1
    return dispatched, skipped
