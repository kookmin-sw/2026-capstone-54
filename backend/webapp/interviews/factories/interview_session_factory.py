import factory
from factory.django import DjangoModelFactory
from interviews.enums import InterviewDifficultyLevel, InterviewSessionStatus, InterviewSessionType
from interviews.models import InterviewSession


class InterviewSessionFactory(DjangoModelFactory):

  class Meta:
    model = InterviewSession

  user = factory.SubFactory("users.factories.UserFactory")
  resume = factory.SubFactory("resumes.factories.ResumeFactory", user=factory.SelfAttribute("..user"))
  user_job_description = factory.SubFactory(
    "job_descriptions.factories.UserJobDescriptionFactory",
    user=factory.SelfAttribute("..user"),
  )
  interview_session_type = InterviewSessionType.FOLLOWUP
  interview_session_status = InterviewSessionStatus.IN_PROGRESS
  interview_difficulty_level = InterviewDifficultyLevel.NORMAL
  total_questions = 0
  total_followup_questions = 0
