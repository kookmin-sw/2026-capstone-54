import factory
from django.utils import timezone
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
    # User.is_email_confirmed / User.is_profile_completed 는 computed property라서 직접 세팅할 수 없다.
    # 테스트에서 편하게 넘길 수 있도록 *_at 필드로 변환한다.
    is_email_confirmed = kwargs.pop("is_email_confirmed", None)
    if is_email_confirmed is True and "email_confirmed_at" not in kwargs:
      kwargs["email_confirmed_at"] = timezone.now()

    is_profile_completed = kwargs.pop("is_profile_completed", None)
    if is_profile_completed is True and "profile_completed_at" not in kwargs:
      kwargs["profile_completed_at"] = timezone.now()

    password = kwargs.pop("password", DEFAULT_PASSWORD)
    return model_class.objects.create_user(password=password, **kwargs)
