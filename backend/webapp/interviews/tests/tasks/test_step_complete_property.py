"""step-complete 흐름의 속성 기반 테스트."""

from unittest.mock import MagicMock

from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from interviews.factories import InterviewRecordingFactory
from interviews.services.update_recording_step_service import UpdateRecordingStepService
from interviews.tasks.process_video_step_complete import STEP_FIELD_MAP

# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

step_name_strategy = st.sampled_from(list(STEP_FIELD_MAP.keys()))
non_empty_output_key_strategy = st.text(
  alphabet=st.characters(whitelist_categories=("L", "N", "P", "S"), whitelist_characters="/-_."),
  min_size=1,
  max_size=200,
)

four_field_strategy = st.fixed_dictionaries(
  {
    "scaled_video_key": st.text(min_size=0, max_size=50),
    "frame_prefix": st.text(min_size=0, max_size=50),
    "scaled_audio_key": st.text(min_size=0, max_size=50),
    "face_analysis_result_key": st.text(min_size=0, max_size=50),
  }
)

json_value_strategy = st.recursive(
  st.one_of(
    st.none(),
    st.booleans(),
    st.integers(min_value=-1_000_000, max_value=1_000_000),
    st.floats(allow_nan=False, allow_infinity=False, min_value=-1e6, max_value=1e6),
    st.text(
      alphabet=st.characters(blacklist_characters="\x00"),
      max_size=50,
    ),
  ),
  lambda children: st.one_of(
    st.lists(children, max_size=5),
    st.dictionaries(
      st.text(alphabet=st.characters(blacklist_characters="\x00"), max_size=20),
      children,
      max_size=5,
    ),
  ),
  max_leaves=20,
)

_pg_safe_text = st.text(alphabet=st.characters(blacklist_characters="\x00"), max_size=20)

face_result_strategy = st.fixed_dictionaries(
  {
    "metadata": st.dictionaries(_pg_safe_text, json_value_strategy, min_size=1, max_size=5),
    "statistics": st.dictionaries(_pg_safe_text, json_value_strategy, min_size=1, max_size=5),
    "frames": st.lists(json_value_strategy, min_size=0, max_size=5),
  }
)

# ---------------------------------------------------------------------------
# Property 2: Step field mapping round-trip
# ---------------------------------------------------------------------------


# Feature: face-analysis-infra, Property 2: Step field mapping round-trip
class TestStepFieldMappingRoundTrip(TestCase):
  """STEP_FIELD_MAP의 step 이름과 임의의 output_key로 서비스 호출 시 올바른 필드에 저장되는지 검증한다."""

  @given(step=step_name_strategy, output_key=non_empty_output_key_strategy)
  @settings(max_examples=100, deadline=None)
  def test_step_field_mapping_round_trip(self, step, output_key):
    """**Validates: Requirements 4.3, 4.5**"""
    recording = InterviewRecordingFactory()

    UpdateRecordingStepService(
      session_uuid=str(recording.interview_session_id),
      turn_id=str(recording.interview_turn_id),
      field_name=STEP_FIELD_MAP[step],
      output_key=output_key,
    ).perform()

    recording.refresh_from_db()
    actual = getattr(recording, STEP_FIELD_MAP[step])
    self.assertEqual(actual, output_key)


# ---------------------------------------------------------------------------
# Property 3: All-steps-complete requires all fields filled
# ---------------------------------------------------------------------------


# Feature: face-analysis-infra, Property 3: All-steps-complete requires all fields filled
class TestAllStepsCompleteProperty(TestCase):
  """4개 필드의 empty/non-empty 조합에 따라 _all_steps_complete 결과를 검증한다."""

  @given(fields=four_field_strategy)
  @settings(max_examples=100, deadline=None)
  def test_all_steps_complete_requires_all_fields_filled(self, fields):
    """**Validates: Requirements 4.7**"""
    recording = MagicMock()
    recording.scaled_video_key = fields["scaled_video_key"]
    recording.frame_prefix = fields["frame_prefix"]
    recording.scaled_audio_key = fields["scaled_audio_key"]
    recording.face_analysis_result_key = fields["face_analysis_result_key"]

    result = UpdateRecordingStepService._all_steps_complete(recording)

    all_filled = all(
      [
        fields["scaled_video_key"],
        fields["frame_prefix"],
        fields["scaled_audio_key"],
        fields["face_analysis_result_key"],
      ]
    )
    self.assertEqual(result, all_filled)


# ---------------------------------------------------------------------------
# Property 5: Face analysis result JSON preserves full structure
# ---------------------------------------------------------------------------


# Feature: face-analysis-infra, Property 5: Face analysis result JSON preserves full structure
class TestFaceAnalysisResultJsonPreservation(TestCase):
  """face_analyzer 결과 JSON이 StoreFaceAnalysisResultService를 통해 DB에 저장된 후에도 전체 구조가 보존되는지 검증한다."""

  @given(result_json=face_result_strategy)
  @settings(max_examples=100, deadline=None)
  def test_face_analysis_result_json_preserves_full_structure(self, result_json):
    """**Validates: Requirements 4.1**"""
    import json
    from io import BytesIO
    from unittest.mock import MagicMock, patch

    from interviews.factories import InterviewRecordingFactory
    from interviews.services.store_face_analysis_result_service import StoreFaceAnalysisResultService

    recording = InterviewRecordingFactory()

    mock_s3 = MagicMock()
    mock_s3.get_object.return_value = {
      "Body": BytesIO(json.dumps(result_json).encode("utf-8")),
    }

    with patch(
      "interviews.services.store_face_analysis_result_service.get_video_s3_client",
      return_value=mock_s3,
    ):
      StoreFaceAnalysisResultService(
        session_uuid=str(recording.interview_session_id),
        turn_id=str(recording.interview_turn_id),
        output_bucket="test-bucket",
        output_key="test-key",
      ).perform()

    recording.refresh_from_db()
    stored = recording.face_analysis_result

    self.assertEqual(stored.get("metadata"), result_json["metadata"])
    self.assertEqual(stored.get("statistics"), result_json["statistics"])
    self.assertEqual(stored.get("frames"), result_json["frames"])
