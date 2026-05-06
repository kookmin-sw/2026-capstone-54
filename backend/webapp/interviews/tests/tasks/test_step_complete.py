"""step-complete 흐름의 단위 테스트."""

import json
from io import BytesIO
from unittest.mock import MagicMock, patch

from django.test import TestCase
from interviews.factories import InterviewRecordingFactory
from interviews.services.store_face_analysis_result_service import (
  StoreFaceAnalysisResultService,
  _fetch_face_analysis_json,
)
from interviews.tasks.process_video_step_complete import (
  STEP_FIELD_MAP,
  _store_face_analysis_result,
)


class TestStepFieldMapContainsFaceAnalyzer(TestCase):
  """STEP_FIELD_MAP에 face_analyzer 키가 존재하는지 검증한다."""

  def test_step_field_map_contains_face_analyzer(self):
    """STEP_FIELD_MAP에 face_analyzer 키가 존재해야 한다."""
    self.assertIn("face_analyzer", STEP_FIELD_MAP)
    self.assertEqual(STEP_FIELD_MAP["face_analyzer"], "face_analysis_result_key")


class TestFetchFaceAnalysisJson(TestCase):
  """_fetch_face_analysis_json 함수의 동작을 검증한다."""

  @patch("interviews.services.store_face_analysis_result_service.get_video_s3_client")
  def test_reads_and_parses_json_from_s3(self, mock_get_s3):
    """S3에서 JSON을 읽어 dict로 반환한다."""
    expected = {"metadata": {"total_frames": 5}, "frames": [{"frame_id": "f1"}]}
    mock_s3 = MagicMock()
    mock_get_s3.return_value = mock_s3
    mock_s3.get_object.return_value = {
      "Body": BytesIO(json.dumps(expected).encode("utf-8")),
    }

    result = _fetch_face_analysis_json("bucket", "key")

    self.assertEqual(result, expected)
    mock_s3.get_object.assert_called_once_with(Bucket="bucket", Key="key")


class TestStoreFaceAnalysisResultService(TestCase):
  """StoreFaceAnalysisResultService의 정상 동작을 검증한다."""

  def setUp(self):
    self.recording = InterviewRecordingFactory()
    self.session_uuid = str(self.recording.interview_session_id)
    self.turn_id = str(self.recording.interview_turn_id)

  @patch("interviews.services.store_face_analysis_result_service.get_video_s3_client")
  def test_stores_full_result_including_frames(self, mock_get_s3):
    """S3에서 JSON을 읽어 frames 포함 전체 결과를 JSONField에 저장한다."""
    result_json = {
      "metadata": {
        "total_frames": 2,
        "analyzer_version": "3.0.0"
      },
      "statistics": {
        "face_detected_rate": 0.9,
        "dominant_expression": "neutral"
      },
      "frames": [
        {
          "frame_id": "f1",
          "expression": "neutral",
          "smile_score": 0.1
        },
        {
          "frame_id": "f2",
          "expression": "positive",
          "smile_score": 0.8
        },
      ],
      "sessionUuid": self.session_uuid,
      "turnId": self.turn_id,
    }
    mock_s3 = MagicMock()
    mock_get_s3.return_value = mock_s3
    mock_s3.get_object.return_value = {
      "Body": BytesIO(json.dumps(result_json).encode("utf-8")),
    }

    StoreFaceAnalysisResultService(
      session_uuid=self.session_uuid,
      turn_id=self.turn_id,
      output_bucket="test-bucket",
      output_key="session/turn/frames/face_analysis_result.json",
    ).perform()

    self.recording.refresh_from_db()
    stored = self.recording.face_analysis_result
    self.assertIn("metadata", stored)
    self.assertIn("statistics", stored)
    self.assertIn("frames", stored)
    self.assertEqual(len(stored["frames"]), 2)
    self.assertEqual(stored["frames"][0]["frame_id"], "f1")


class TestStoreFaceAnalysisResultTaskFunction(TestCase):
  """태스크 함수 _store_face_analysis_result의 에러 처리를 검증한다."""

  def setUp(self):
    self.recording = InterviewRecordingFactory()
    self.session_uuid = str(self.recording.interview_session_id)
    self.turn_id = str(self.recording.interview_turn_id)

  @patch("interviews.tasks.process_video_step_complete._send_dispatch_failure_alert")
  @patch("interviews.services.store_face_analysis_result_service.get_video_s3_client")
  def test_s3_failure_no_propagation(self, mock_get_s3, mock_alert):
    """S3 읽기 실패 시 예외가 전파되지 않는다."""
    mock_s3 = MagicMock()
    mock_get_s3.return_value = mock_s3
    mock_s3.get_object.side_effect = Exception("S3 connection error")

    # 예외가 전파되지 않아야 한다
    _store_face_analysis_result(
      session_uuid=self.session_uuid,
      turn_id=self.turn_id,
      output_bucket="test-bucket",
      output_key="session/turn/frames/face_analysis_result.json",
    )

    # face_analysis_result는 변경되지 않아야 한다
    self.recording.refresh_from_db()
    self.assertEqual(self.recording.face_analysis_result, {})

    # 에러 알림이 호출되어야 한다
    mock_alert.assert_called_once()
