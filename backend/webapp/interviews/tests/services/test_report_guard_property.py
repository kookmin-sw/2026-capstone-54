# Feature: face-analysis-infra, Property 4: Face analysis pending detects incomplete recordings
"""face_analysis_pending 속성 기반 테스트."""

from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from interviews.factories import InterviewRecordingFactory, InterviewSessionFactory
from interviews.services.regenerate_analysis_report_service import face_analysis_pending


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# 비어있지 않은 face_analysis_result dict를 생성하는 전략
filled_result_strategy = st.fixed_dictionaries({
  "metadata": st.fixed_dictionaries({
    "total_frames": st.integers(min_value=1, max_value=100),
  }),
  "statistics": st.fixed_dictionaries({
    "face_detected_rate": st.floats(min_value=0.0, max_value=1.0, allow_nan=False),
    "dominant_expression": st.sampled_from(["positive", "negative", "neutral"]),
  }),
})

# 각 recording이 빈 dict인지 채워진 dict인지를 나타내는 전략
# True = 빈 dict (pending), False = 채워진 dict (complete)
recording_states_strategy = st.lists(
  st.booleans(),
  min_size=1,
  max_size=5,
)


class TestFaceAnalysisPendingProperty(TestCase):
  """세션 내 recording 집합에서 face_analysis_pending이 올바르게 감지하는지 검증한다."""

  @given(
    is_empty_list=recording_states_strategy,
    filled_result=filled_result_strategy,
  )
  @settings(max_examples=100, deadline=None)
  def test_face_analysis_pending_detects_incomplete_recordings(self, is_empty_list, filled_result):
    """**Validates: Requirements 5.2**"""
    session = InterviewSessionFactory()

    for is_empty in is_empty_list:
      if is_empty:
        InterviewRecordingFactory(
          interview_session=session,
          face_analysis_result={},
        )
      else:
        InterviewRecordingFactory(
          interview_session=session,
          face_analysis_result=filled_result,
        )

    result = face_analysis_pending(session)
    has_any_empty = any(is_empty_list)

    self.assertEqual(result, has_any_empty)
