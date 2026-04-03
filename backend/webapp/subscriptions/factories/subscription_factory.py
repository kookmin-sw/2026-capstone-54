from datetime import timedelta

import factory
from django.utils import timezone
from subscriptions.enums import PlanType
from subscriptions.models import Subscription
from users.factories import UserFactory


class SubscriptionFactory(factory.django.DjangoModelFactory):

  class Meta:
    model = Subscription

  user = factory.SubFactory(UserFactory)
  plan_type = PlanType.FREE
  started_at = factory.LazyFunction(timezone.now)
  expires_at = None
  cancelled_at = None

  class Params:
    pro = factory.Trait(
      plan_type=PlanType.PRO,
      expires_at=factory.LazyFunction(lambda: timezone.now() + timedelta(days=30)),
    )
    cancelled = factory.Trait(cancelled_at=factory.LazyFunction(timezone.now), )
    expired = factory.Trait(expires_at=factory.LazyFunction(lambda: timezone.now() - timedelta(days=1)), )
