import factory
from factory.django import DjangoModelFactory
from interviews.enums import RecordingMediaType, RecordingStatus
from interviews.models import InterviewRecording


class InterviewRecordingFactory(DjangoModelFactory):

  class Meta:
    model = InterviewRecording

  interview_session = factory.SubFactory("interviews.factories.InterviewSessionFactory")
  interview_turn = factory.SubFactory("interviews.factories.InterviewTurnFactory")
  user = factory.LazyAttribute(lambda o: o.interview_session.user)
  media_type = RecordingMediaType.VIDEO
  status = RecordingStatus.INITIATED
  s3_bucket = "pj-kmucd1-04-mefit-video-files"
  s3_key = factory.LazyAttribute(lambda o: f"{o.interview_session.pk}/{o.interview_turn.pk}/test.webm")
