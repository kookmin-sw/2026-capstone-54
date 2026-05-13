import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeEmbedding
from users.factories import UserFactory


class ResumeEmbeddingFactory(DjangoModelFactory):

  class Meta:
    model = ResumeEmbedding

  user = factory.SubFactory(UserFactory)
  resume = factory.SubFactory(ResumeFactory, user=factory.SelfAttribute("..user"))
  context = "Python 백엔드 개발 경험이 있습니다."
  chunk_type = "text"
  chunk_index = factory.Sequence(lambda n: n)
  # embedding_vector는 테스트에서 필요 시 직접 설정
