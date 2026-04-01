import secrets
import string
from datetime import timedelta

import factory
from django.utils import timezone
from factory.django import DjangoModelFactory
from users.factories.user_factory import UserFactory
from users.models import EmailVerificationCode

_CODE_ALPHABET = string.ascii_uppercase + string.digits


class EmailVerificationCodeFactory(DjangoModelFactory):

  class Meta:
    model = EmailVerificationCode

  user = factory.SubFactory(UserFactory)
  code = factory.LazyFunction(lambda: "".join(secrets.choice(_CODE_ALPHABET) for _ in range(6)))
  expires_at = factory.LazyFunction(lambda: timezone.now() + timedelta(minutes=10))
