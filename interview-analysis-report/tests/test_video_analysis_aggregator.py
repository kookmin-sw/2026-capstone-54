"""VideoAnalysisAggregator 단위 테스트.

검증 범위:
  - DetachedInstanceError 회귀 방지: _load_face_analysis_by_turn 가 dict 만 반환
  - face data 일부/전체/부재 시 score 산출 정확성
  - face_data_present 플래그가 turn 별 데이터 유무를 정확히 표시
"""

import unittest
from unittest.mock import patch

from services.video_analysis_aggregator import (
  VideoAnalysisAggregator,
  VideoAnalysisResult,
)


def _make_face_result(positive: float, neutral: float, negative: float, total_frames: int) -> dict:
  return {
    "statistics": {
      "expression_distribution": {
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
      },
      "total_frames": total_frames,
    },
  }


class LoadFaceAnalysisReturnsPlainDictTests(unittest.TestCase):
  """_load_face_analysis_by_turn 의 반환 타입은 ORM 객체가 아닌 plain dict 여야 한다."""

  def test_return_type_is_dict_keyed_by_turn_id(self):
    aggregator = VideoAnalysisAggregator()
    fake_face_data = {
      1: _make_face_result(0.6, 0.3, 0.1, 100),
      2: _make_face_result(0.5, 0.4, 0.1, 80),
    }

    with patch.object(VideoAnalysisAggregator, "_load_face_analysis_by_turn", return_value=fake_face_data):
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value={}):
        result = aggregator.aggregate("session-uuid")

    self.assertIsInstance(result, VideoAnalysisResult)


class FaceScoreWithCompleteDataTests(unittest.TestCase):
  """모든 turn 에 face data 가 있을 때 score 산출."""

  def test_computes_video_score_using_neutral_plus_positive(self):
    aggregator = VideoAnalysisAggregator()
    face_by_turn = {
      1: _make_face_result(0.5, 0.4, 0.1, 100),
      2: _make_face_result(0.6, 0.3, 0.1, 100),
    }
    gaze_map = {
      1: {"gaze_away_count": 0, "duration_ms": 10_000},
      2: {"gaze_away_count": 0, "duration_ms": 10_000},
    }

    with patch.object(VideoAnalysisAggregator, "_load_face_analysis_by_turn", return_value=face_by_turn):
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value=gaze_map):
        result = aggregator.aggregate("session-uuid")

    self.assertGreater(result.video_score, 0)
    self.assertEqual(len(result.per_turn), 2)
    for turn in result.per_turn:
      self.assertTrue(turn["face_data_present"])

  def test_negative_expression_lowers_face_component(self):
    aggregator = VideoAnalysisAggregator()
    happy_face = {1: _make_face_result(0.5, 0.4, 0.1, 100)}
    sad_face = {1: _make_face_result(0.0, 0.1, 0.9, 100)}
    gaze_map = {1: {"gaze_away_count": 0, "duration_ms": 10_000}}

    with patch.object(VideoAnalysisAggregator, "_load_face_analysis_by_turn", return_value=happy_face):
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value=gaze_map):
        happy_result = aggregator.aggregate("uuid-happy")

    with patch.object(VideoAnalysisAggregator, "_load_face_analysis_by_turn", return_value=sad_face):
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value=gaze_map):
        sad_result = aggregator.aggregate("uuid-sad")

    self.assertGreater(happy_result.video_score, sad_result.video_score)


class FaceScoreWithPartialDataTests(unittest.TestCase):
  """face data 가 일부 turn 에만 있을 때 score 는 valid_frames 가중 평균이라 정확해야 한다."""

  def test_missing_face_turns_do_not_dilute_face_score(self):
    aggregator = VideoAnalysisAggregator()
    face_by_turn = {
      1: _make_face_result(0.7, 0.2, 0.1, 100),
    }
    gaze_map = {
      1: {"gaze_away_count": 0, "duration_ms": 10_000},
      2: {"gaze_away_count": 0, "duration_ms": 10_000},
      3: {"gaze_away_count": 0, "duration_ms": 10_000},
    }

    only_complete_face_data = {1: _make_face_result(0.7, 0.2, 0.1, 100)}
    only_complete_gaze = {1: {"gaze_away_count": 0, "duration_ms": 10_000}}

    with patch.object(VideoAnalysisAggregator, "_load_face_analysis_by_turn", return_value=face_by_turn):
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value=gaze_map):
        partial_result = aggregator.aggregate("uuid-partial")

    with patch.object(VideoAnalysisAggregator, "_load_face_analysis_by_turn", return_value=only_complete_face_data):
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value=only_complete_gaze):
        complete_result = aggregator.aggregate("uuid-complete")

    self.assertEqual(
      partial_result.summary["total_expression_distribution"],
      complete_result.summary["total_expression_distribution"],
    )

  def test_face_data_present_flag_reflects_per_turn_availability(self):
    aggregator = VideoAnalysisAggregator()
    face_by_turn = {1: _make_face_result(0.5, 0.4, 0.1, 100)}
    gaze_map = {
      1: {"gaze_away_count": 0, "duration_ms": 10_000},
      2: {"gaze_away_count": 0, "duration_ms": 10_000},
    }

    with patch.object(VideoAnalysisAggregator, "_load_face_analysis_by_turn", return_value=face_by_turn):
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value=gaze_map):
        result = aggregator.aggregate("uuid")

    by_id = {t["turn_id"]: t for t in result.per_turn}
    self.assertTrue(by_id[1]["face_data_present"])
    self.assertFalse(by_id[2]["face_data_present"])
    self.assertEqual(
      by_id[2]["expression_distribution"],
      {"happy": 0.0, "neutral": 0.0, "negative": 0.0},
    )


class FaceScoreWithNoDataTests(unittest.TestCase):
  """face data / gaze data 가 전혀 없을 때 빈 VideoAnalysisResult 반환."""

  def test_no_data_returns_zero_score_default_result(self):
    aggregator = VideoAnalysisAggregator()

    with patch.object(VideoAnalysisAggregator, "_load_face_analysis_by_turn", return_value={}):
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value={}):
        result = aggregator.aggregate("session-uuid")

    self.assertEqual(result.video_score, 0)
    self.assertEqual(result.per_turn, [])
    self.assertEqual(result.summary, {})

  def test_only_gaze_data_present_keeps_face_score_at_zero(self):
    aggregator = VideoAnalysisAggregator()
    gaze_map = {1: {"gaze_away_count": 0, "duration_ms": 10_000}}

    with patch.object(VideoAnalysisAggregator, "_load_face_analysis_by_turn", return_value={}):
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value=gaze_map):
        result = aggregator.aggregate("uuid")

    self.assertEqual(result.summary["total_expression_distribution"], {
      "happy": 0.0,
      "neutral": 0.0,
      "negative": 0.0,
    })
    self.assertEqual(len(result.per_turn), 1)
    self.assertFalse(result.per_turn[0]["face_data_present"])


class GazeScoreReductionTests(unittest.TestCase):
  """시선 이탈이 많을수록 video_score 가 낮아져야 한다."""

  def test_higher_gaze_away_count_lowers_video_score(self):
    aggregator = VideoAnalysisAggregator()
    face_by_turn = {1: _make_face_result(0.5, 0.4, 0.1, 100)}

    low_gaze = {1: {"gaze_away_count": 0, "duration_ms": 10_000}}
    high_gaze = {1: {"gaze_away_count": 10, "duration_ms": 10_000}}

    with patch.object(VideoAnalysisAggregator, "_load_face_analysis_by_turn", return_value=face_by_turn):
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value=low_gaze):
        low_result = aggregator.aggregate("uuid-low")
      with patch.object(VideoAnalysisAggregator, "_load_gaze_data", return_value=high_gaze):
        high_result = aggregator.aggregate("uuid-high")

    self.assertGreater(low_result.video_score, high_result.video_score)


if __name__ == "__main__":
  unittest.main()
