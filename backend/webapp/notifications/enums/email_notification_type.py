from django.db import models


class EmailNotificationType(models.TextChoices):
  """이메일 알림 타입.

  각 타입은 사용자별 동의/거절 시각이 별도 컬럼으로 관리된다.
  - STREAK_REMINDER: 저녁 8시 미연습 알림
  - STREAK_EXPIRE:   자정 1시간 전 만료 경고
  - REPORT_READY:    AI 면접 리뷰 리포트 생성 완료 알림
  - SERVICE_NOTICE:  서비스 공지/업데이트 (어드민 트리거)
  - MARKETING:       마케팅 정보 (어드민 트리거)
  """

  STREAK_REMINDER = "streak_reminder", "스트릭 리마인더"
  STREAK_EXPIRE = "streak_expire", "스트릭 만료 경고"
  REPORT_READY = "report_ready", "면접 리포트 완성"
  SERVICE_NOTICE = "service_notice", "서비스 공지 및 업데이트"
  MARKETING = "marketing", "마케팅 정보 수신"

  @classmethod
  def opted_in_field(cls, value: str) -> str:
    return f"{value}_opted_in_at"

  @classmethod
  def opted_out_field(cls, value: str) -> str:
    return f"{value}_opted_out_at"
