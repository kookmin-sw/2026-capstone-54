import factory
from factory.django import DjangoModelFactory
from profiles.models import JobCategory

_EMOJIS = ["💻", "📢", "💰", "🎨", "🤝", "👥", "📊", "🏥", "🎓", "⚙️"]


class JobCategoryFactory(DjangoModelFactory):

  class Meta:
    model = JobCategory

  emoji = factory.Sequence(lambda n: _EMOJIS[n % len(_EMOJIS)])
  name = factory.Sequence(lambda n: f"직군{n}")
