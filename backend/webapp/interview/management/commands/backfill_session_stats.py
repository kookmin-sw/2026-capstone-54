"""기존 세션 데이터의 통계 필드를 Exchange 테이블에서 집계하여 일괄 업데이트."""

from django.core.management.base import BaseCommand
from django.db.models import Avg
from django.db.models.functions import Length
from interview.models import InterviewSession


class Command(BaseCommand):
  help = "기존 InterviewSession의 통계 필드를 Exchange에서 집계하여 채웁니다."

  def handle(self, *args, **options):
    sessions = InterviewSession.objects.all()
    updated = 0

    for session in sessions:
      exchanges = session.exchanges.all()
      if not exchanges.exists():
        continue

      initial_count = exchanges.filter(exchange_type="initial").count()
      followup_count = exchanges.filter(exchange_type="followup").count()
      avg_len = exchanges.annotate(answer_len=Length("answer")).aggregate(avg=Avg("answer_len"))["avg"]

      # started_at: 첫 exchange의 created_at
      first = exchanges.order_by("created_at").first()
      last = exchanges.order_by("-created_at").first()

      session.total_initial_questions = initial_count
      session.total_followup_questions = followup_count
      session.avg_answer_length = int(avg_len) if avg_len else 0

      if not session.started_at and first:
        session.started_at = first.created_at
      if not session.finished_at and last:
        session.finished_at = last.created_at

      if session.started_at and session.finished_at:
        session.duration_seconds = int((session.finished_at - session.started_at).total_seconds())

      # 토큰이 있으면 완료로 간주
      if session.total_tokens > 0:
        session.status = InterviewSession.Status.COMPLETED
      else:
        session.status = InterviewSession.Status.ABANDONED

      session.save(
        update_fields=[
          "total_initial_questions",
          "total_followup_questions",
          "avg_answer_length",
          "started_at",
          "finished_at",
          "duration_seconds",
          "status",
        ]
      )
      updated += 1

    self.stdout.write(self.style.SUCCESS(f"{updated}개 세션 업데이트 완료"))
