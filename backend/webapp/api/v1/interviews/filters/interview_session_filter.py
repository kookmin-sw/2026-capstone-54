from django_filters import rest_framework as filters
from interviews.models import InterviewSession


class InterviewSessionFilter(filters.FilterSet):
  """
  면접 세션 필터.

  쿼리 파라미터:
    - interview_session_type: MOCK_INTERVIEW | PRACTICE_INTERVIEW
    - interview_session_status: IN_PROGRESS | PAUSED | COMPLETED
    - interview_difficulty_level: EASY | NORMAL | HARD
    - interview_practice_mode: PRACTICE | REAL
    - stt_mode: BROWSER | SERVER
    - created_at_after: 생성일 이후 (YYYY-MM-DD)
    - created_at_before: 생성일 이전 (YYYY-MM-DD)
    - resume_uuid: 이력서 UUID로 필터링
    - user_job_description_uuid: 채용공고 UUID로 필터링

  사용 예시:
    ?interview_session_status=COMPLETED&interview_difficulty_level=HARD
    ?created_at_after=2025-01-01&created_at_before=2025-01-31
  """

  created_at_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
  created_at_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
  resume_uuid = filters.UUIDFilter(field_name='resume__uuid')
  user_job_description_uuid = filters.UUIDFilter(field_name='user_job_description__uuid')

  class Meta:
    model = InterviewSession
    fields = [
      'interview_session_type',
      'interview_session_status',
      'interview_difficulty_level',
      'interview_practice_mode',
      'stt_mode',
      'created_at_after',
      'created_at_before',
      'resume_uuid',
      'user_job_description_uuid',
    ]
