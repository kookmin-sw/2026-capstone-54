from django.db import migrations, models


class Migration(migrations.Migration):

  atomic = False

  dependencies = [
    ("interviews", "0008_dedupe_active_interview_sessions"),
  ]

  operations = [
    migrations.SeparateDatabaseAndState(
      database_operations=[
        migrations.RunSQL(
          sql=
          "CREATE UNIQUE INDEX CONCURRENTLY uq_active_interview_session_per_user ON interview_sessions (user_id) WHERE interview_session_status IN ('in_progress', 'paused');",
          reverse_sql="DROP INDEX CONCURRENTLY IF EXISTS uq_active_interview_session_per_user;",
        )
      ],
      state_operations=[
        migrations.AddConstraint(
          model_name="interviewsession",
          constraint=models.UniqueConstraint(
            condition=models.Q(interview_session_status__in=["in_progress", "paused"]),
            fields=["user"],
            name="uq_active_interview_session_per_user",
          ),
        ),
      ],
    )
  ]
