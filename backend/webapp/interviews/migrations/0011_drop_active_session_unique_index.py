from django.db import migrations


class Migration(migrations.Migration):
  """uq_active_interview_session_per_user partial unique index 제거.

  사용자 spec 변경: 같은 사용자가 여러 active 인터뷰 세션을 동시에 가질 수 있어야 한다.
  Postgres CREATE/DROP INDEX CONCURRENTLY 는 트랜잭션 내에서 실행할 수 없으므로 atomic=False.
  """

  atomic = False

  dependencies = [
    ("interviews", "0010_interviewsession_stt_mode_and_more"),
  ]

  operations = [
    migrations.SeparateDatabaseAndState(
      database_operations=[
        migrations.RunSQL(
          sql="DROP INDEX CONCURRENTLY IF EXISTS uq_active_interview_session_per_user;",
          reverse_sql=
          "CREATE UNIQUE INDEX CONCURRENTLY uq_active_interview_session_per_user ON interview_sessions (user_id) WHERE interview_session_status IN ('in_progress', 'paused');",
        )
      ],
      state_operations=[
        migrations.RemoveConstraint(
          model_name="interviewsession",
          name="uq_active_interview_session_per_user",
        ),
      ],
    ),
  ]
