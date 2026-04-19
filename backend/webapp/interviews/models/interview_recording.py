from common.models import BaseModelWithUUID
from django.conf import settings
from django.db import models
from interviews.enums import RecordingMediaType, RecordingStatus


class InterviewRecording(BaseModelWithUUID):

  class Meta(BaseModelWithUUID.Meta):
    db_table = "interview_recordings"
    verbose_name = "면접 녹화"
    verbose_name_plural = "면접 녹화 목록"
    ordering = ["created_at"]

  interview_session = models.ForeignKey(
    "interviews.InterviewSession",
    on_delete=models.CASCADE,
    related_name="recordings",
    verbose_name="면접 세션",
  )
  interview_turn = models.ForeignKey(
    "interviews.InterviewTurn",
    on_delete=models.CASCADE,
    related_name="recordings",
    verbose_name="면접 턴",
  )
  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="interview_recordings",
    verbose_name="사용자",
  )

  media_type = models.CharField(
    max_length=10,
    choices=RecordingMediaType.choices,
    verbose_name="미디어 유형",
  )
  status = models.CharField(
    max_length=20,
    choices=RecordingStatus.choices,
    default=RecordingStatus.INITIATED,
    verbose_name="상태",
  )

  s3_bucket = models.CharField(max_length=100, verbose_name="S3 버킷")
  s3_key = models.CharField(max_length=500, verbose_name="S3 키")
  upload_id = models.CharField(max_length=200, blank=True, default="", verbose_name="업로드 ID")

  start_timestamp = models.DateTimeField(null=True, blank=True, verbose_name="녹화 시작 시각")
  end_timestamp = models.DateTimeField(null=True, blank=True, verbose_name="녹화 종료 시각")
  duration_ms = models.PositiveIntegerField(null=True, blank=True, verbose_name="녹화 길이 (ms)")

  scaled_video_key = models.CharField(max_length=500, blank=True, default="", verbose_name="스케일 영상 S3 키")
  frame_prefix = models.CharField(max_length=500, blank=True, default="", verbose_name="프레임 S3 접두사")
  audio_key = models.CharField(max_length=500, blank=True, default="", verbose_name="음성 S3 키")
  scaled_audio_key = models.CharField(max_length=500, blank=True, default="", verbose_name="스케일 음성 S3 키")

  def __str__(self):
    return f"InterviewRecording {self.pk} [{self.media_type}] ({self.status})"
