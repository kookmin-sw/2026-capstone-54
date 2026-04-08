from common.services import BaseService
from subscriptions.enums import PlanType
from subscriptions.models import Subscription


class CreateFreeSubscriptionService(BaseService):
  """신규 사용자에게 무료 구독을 생성한다.

  사용자 생성 시 post_save 시그널을 통해 자동으로 호출된다.
  status는 DB 컬럼이 아닌 property이므로 전달하지 않는다.
  free 구독은 expires_at=None이므로 항상 ACTIVE 상태다.
  """

  def execute(self):
    return Subscription.objects.create(
      user=self.user,
      plan_type=PlanType.FREE,
      expires_at=None,
    )
