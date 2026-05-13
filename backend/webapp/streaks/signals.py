"""streaks 앱 도메인 시그널 정의."""

from django.dispatch import Signal

# 면접 참여 기록 완료 시 발행. kwargs: user, streak_log
interview_completed = Signal()

# 스트릭 만료 처리 완료 시 발행. kwargs: expired_user_ids
streak_expired = Signal()
