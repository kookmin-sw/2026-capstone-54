import factory
from subscriptions.enums import PlanType
from subscriptions.models import SubscriptionPlanTicketPolicy


class SubscriptionPlanTicketPolicyFactory(factory.django.DjangoModelFactory):

  class Meta:
    model = SubscriptionPlanTicketPolicy

  plan_type = PlanType.PRO
  daily_ticket_amount = 3
  is_active = True
