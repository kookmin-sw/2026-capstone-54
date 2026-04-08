import factory
from factory.django import DjangoModelFactory
from users.models import User

DEFAULT_PASSWORD = "ValidPass123!"  # nosec - test fixture default password


class UserFactory(DjangoModelFactory):

  class Meta:
    model = User

  name = factory.Sequence(lambda n: f"테스트유저{n}")
  email = factory.Sequence(lambda n: f"user{n}@example.com")

  @classmethod
  def _create(cls, model_class, *args, **kwargs):
    password = kwargs.pop("password", DEFAULT_PASSWORD)
    return model_class.objects.create_user(password=password, **kwargs)
