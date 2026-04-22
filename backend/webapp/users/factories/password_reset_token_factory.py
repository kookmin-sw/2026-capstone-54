import uuid
from datetime import timedelta

import factory
from django.utils import timezone
from factory.django import DjangoModelFactory
from users.factories.user_factory import UserFactory
from users.models import PasswordResetToken


class PasswordResetTokenFactory(DjangoModelFactory):

  class Meta:
    model = PasswordResetToken

  user = factory.SubFactory(UserFactory)
  token = factory.LazyFunction(uuid.uuid4)
  expires_at = factory.LazyFunction(lambda: timezone.now() + timedelta(minutes=30))
