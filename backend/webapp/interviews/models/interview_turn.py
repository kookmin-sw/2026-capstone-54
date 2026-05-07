"""면접 턴(질문·답변 쌍) 모델."""

from common.models import BaseModel
from django.db import models
from interviews.enums import InterviewExchangeType, QuestionSource, TranscriptSource, TranscriptStatus


class InterviewTurn(BaseModel):
  """면접 세션 내 하나의 질문·답변 쌍.

    초기 질문(INITIAL)과 꼬리질문(FOLLOWUP) 모두 이 모델로 기록한다.

    turn_number: 앵커 질문의 순번 (1, 2, 3...). follow-up은 앵커와 동일한 값
    followup_order: follow-up의 그룹 내 순번 (1, 2, 3...). 앵커는 NULL

    정렬: turn_number ASC, followup_order ASC (NULL=0 먼저)
    - 앵커1 → turn_number=1, followup_order=NULL
    - 앵커1-FU1 → turn_number=1, followup_order=1
    - 앵커1-FU2 → turn_number=1, followup_order=2
    - 앵커2 → turn_number=2, followup_order=NULL
    - 앵커2-FU1 → turn_number=2, followup_order=1

    ── 행동/발화 메트릭 ──
    gaze_away_count, head_away_count, speech_rate_sps, pillar_word_counts 는 frontend 가
    turn 종료 시점에 한 번 전송한다. InterviewRecording 은 InterviewTurn 과 1:1 대응이므로
    메트릭은 turn 에만 저장한다 (recording 측 중복 저장 없음). 측정은 녹화 시작 ~ 종료 구간으로
    한정되며, 녹화 미사용 turn 에서는 기본값(0 / null / {}) 이 유지된다.
    """

  class Meta(BaseModel.Meta):
    db_table = "interview_turns"
    verbose_name = "면접 턴"
    verbose_name_plural = "면접 턴 목록"
    ordering = ["created_at"]

  interview_session = models.ForeignKey(
    "interviews.InterviewSession",
    on_delete=models.CASCADE,
    related_name="turns",
    verbose_name="면접 세션",
  )

  turn_type = models.CharField(
    max_length=10,
    choices=InterviewExchangeType.choices,
    verbose_name="턴 유형",
  )
  question_source = models.CharField(
    max_length=20,
    choices=QuestionSource.choices,
    default=QuestionSource.UNKNOWN,
    verbose_name="질문 출처",
  )

  question = models.TextField(verbose_name="질문")
  answer = models.TextField(blank=True, default="", verbose_name="답변")
  speech_segments = models.JSONField(
    default=list,
    blank=True,
    verbose_name="발화 세그먼트",
  )

  turn_number = models.PositiveIntegerField(
    default=1,
    verbose_name="턴 번호",
    help_text="앵커는 1부터 순차, follow-up은 앵커와 동일",
  )

  followup_order = models.PositiveIntegerField(
    null=True,
    blank=True,
    verbose_name="꼬리질문 순번",
    help_text="follow-up인 경우에만 값이 있음 (1부터 순차)",
  )

  anchor_turn = models.ForeignKey(
    "self",
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name="followup_turns",
    verbose_name="앵커 질문",
  )

  transcript_status = models.CharField(
    max_length=20,
    choices=TranscriptStatus.choices,
    null=True,
    blank=True,
    default=None,
    verbose_name="STT 상태",
    help_text="None=브라우저 STT 정상 / pending=백엔드 STT 대기 / processing/completed/failed",
  )

  transcript_source = models.CharField(
    max_length=20,
    choices=TranscriptSource.choices,
    default=TranscriptSource.BROWSER_STT,
    verbose_name="STT 출처",
  )

  transcript_error_code = models.CharField(
    max_length=50,
    blank=True,
    default="",
    verbose_name="STT 에러 코드",
  )

  transcript_text = models.TextField(
    blank=True,
    default="",
    verbose_name="STT 텍스트",
    help_text="audio 의 객관적 STT 결과 (analysis-stt worker 가 채움). user 의 answer 와 별개.",
  )

  gaze_away_count = models.PositiveIntegerField(
    default=0,
    verbose_name="시선 이탈 횟수",
    help_text="녹화 중 사용자의 시선이 정면에서 이탈한 누적 횟수 (false→true 전이 단위).",
  )

  head_away_count = models.PositiveIntegerField(
    default=0,
    verbose_name="고개 이탈 횟수",
    help_text="녹화 중 사용자의 고개가 정면에서 이탈한 누적 횟수 (false→true 전이 단위).",
  )

  speech_rate_sps = models.FloatField(
    null=True,
    blank=True,
    verbose_name="발화 속도 (음절/초)",
    help_text="총 음절 수 / 총 발화 시간(초). 측정 불가 시 null.",
  )

  pillar_word_counts = models.JSONField(
    default=dict,
    blank=True,
    verbose_name="필러 단어 사용 빈도",
    help_text="발화 중 사용된 필러 단어별 사용 횟수. 예: {\"음\": 5, \"어\": 3, \"근데\": 1}",
  )

  def __str__(self):
    return f"InterviewTurn #{self.pk} [{self.get_turn_type_display()}] (Session {self.interview_session_id})"
