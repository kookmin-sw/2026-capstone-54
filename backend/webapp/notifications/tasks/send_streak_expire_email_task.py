from common.tasks.base_task import BaseTask
from config.celery import app


class SendStreakExpireEmailTask(BaseTask):

  def run(self, user_id: int, current_streak: int = 0):
    from users.models import User

    from ..services import SendStreakExpireEmailService

    user = User.objects.get(id=user_id)
    return SendStreakExpireEmailService(user=user, current_streak=current_streak).perform()


RegisteredSendStreakExpireEmailTask = app.register_task(SendStreakExpireEmailTask())
