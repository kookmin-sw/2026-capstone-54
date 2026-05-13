from common.tasks.base_task import BaseTask
from config.celery import app


class SendStreakReminderEmailTask(BaseTask):

  def run(self, user_id: int):
    from users.models import User

    from ..services import SendStreakReminderEmailService

    user = User.objects.get(id=user_id)
    return SendStreakReminderEmailService(user=user).perform()


RegisteredSendStreakReminderEmailTask = app.register_task(SendStreakReminderEmailTask())
