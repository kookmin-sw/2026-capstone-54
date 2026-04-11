import factory
from factory.django import DjangoModelFactory
from interviews.enums import InterviewAnalysisReportStatus
from interviews.factories.interview_session_factory import InterviewSessionFactory
from interviews.models import InterviewAnalysisReport


class InterviewAnalysisReportFactory(DjangoModelFactory):

  class Meta:
    model = InterviewAnalysisReport

  interview_session = factory.SubFactory(InterviewSessionFactory)
  interview_analysis_report_status = InterviewAnalysisReportStatus.PENDING
  error_message = ""
  overall_score = None
  overall_grade = ""
  overall_comment = ""
  category_scores = factory.LazyFunction(list)
  question_feedbacks = factory.LazyFunction(list)
  strengths = factory.LazyFunction(list)
  improvement_areas = factory.LazyFunction(list)
