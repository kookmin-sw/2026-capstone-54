from common.models.base_model import BaseModel
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Notification(BaseModel):
  """사용자 알림 모델.

    GenericForeignKey를 통해 모든 도메인 객체(면접, 이력서, 채용공고 등)와 연결 가능하다.
    """

  class Category(models.TextChoices):
    INTERVIEW = "interview", "면접"
    RESUME = "resume", "이력서"
    JD = "jd", "채용공고"
    SYSTEM = "system", "시스템"

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="notifications",
    verbose_name="사용자",
  )
  message = models.TextField(verbose_name="메시지")
  category = models.CharField(
    max_length=20,
    choices=Category.choices,
    verbose_name="카테고리",
    db_index=True,
  )
  is_read = models.BooleanField(default=False, verbose_name="읽음 여부", db_index=True)

  # GenericForeignKey — UUID/정수 PK 모두 수용하기 위해 CharField 사용
  notifiable_type = models.ForeignKey(
    ContentType,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    verbose_name="관련 모델 타입",
  )
  notifiable_id = models.CharField(
    max_length=40,
    null=True,
    blank=True,
    verbose_name="관련 객체 PK",
  )
  notifiable = GenericForeignKey("notifiable_type", "notifiable_id")

  class Meta(BaseModel.Meta):
    db_table = "notifications"
    verbose_name = "알림"
    verbose_name_plural = "알림 목록"
    ordering = ["-created_at"]
    indexes = [
      *BaseModel.Meta.indexes,
      models.Index(fields=["user", "-created_at"], name="notif_user_created_idx"),
    ]

  def __str__(self):
    return f"[{self.category}] {self.user} — {self.message[:30]}"
