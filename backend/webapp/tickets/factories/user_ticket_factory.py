import factory
from factory.django import DjangoModelFactory
from tickets.models import UserTicket


class UserTicketFactory(DjangoModelFactory):

  class Meta:
    model = UserTicket

  user = factory.SubFactory("users.factories.UserFactory")
  count = 0
