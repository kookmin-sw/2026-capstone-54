import factory
from factory.django import DjangoModelFactory
from interviews.enums import InterviewExchangeType, QuestionSource
from interviews.factories.interview_session_factory import InterviewSessionFactory
from interviews.models import InterviewTurn


class InterviewTurnFactory(DjangoModelFactory):

  class Meta:
    model = InterviewTurn

  interview_session = factory.SubFactory(InterviewSessionFactory)
  turn_type = InterviewExchangeType.INITIAL
  question_source = QuestionSource.RESUME
  question = factory.Sequence(lambda n: f"질문 {n}번입니다.")
  answer = ""
  turn_number = factory.Sequence(lambda n: n + 1)
