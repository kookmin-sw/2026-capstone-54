"""Tests for face_analyzer handler — SQS 이벤트 파싱 및 S3 결과 저장.

Covers:
- Task 3.3: Unit tests for SQS 이벤트 파싱 및 S3 저장
  - SQS Records 이벤트 파싱 정상 동작 확인
  - 직접 호출 이벤트 하위 호환성 확인
  - S3에 결과 JSON이 올바른 키로 저장되는지 확인
  - publish_step_complete의 output_key가 result_key인지 확인

Requirements: 설계 결정 4, 설계 결정 3-1
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch, call

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SAMPLE_RESULT = {
    "metadata": {"total_frames": 3, "analyzer_version": "3.0.0"},
    "statistics": {"face_detected_count": 2, "dominant_expression": "neutral"},
    "frames": [{"frame": "f1"}, {"frame": "f2"}],
}

DIRECT_EVENT = {
    "frameBucket": "my-bucket",
    "framePrefix": "sess-1/turn-1/frames/",
    "sessionUuid": "sess-1",
    "turnId": "turn-1",
}

SQS_EVENT = {
    "Records": [
        {
            "body": json.dumps(DIRECT_EVENT),
        }
    ],
}

FRAME_KEYS = [
    "sess-1/turn-1/frames/frame_000001.jpg",
    "sess-1/turn-1/frames/frame_000002.jpg",
]


def _build_mock_s3_client(frame_keys: list[str] | None = None):
    """Build a mock S3 client with paginator support."""
    mock_s3 = MagicMock()
    keys = frame_keys or FRAME_KEYS
    mock_paginator = MagicMock()
    mock_paginator.paginate.return_value = [
        {"Contents": [{"Key": k} for k in keys]}
    ]
    mock_s3.get_paginator.return_value = mock_paginator
    return mock_s3


# ---------------------------------------------------------------------------
# Test: SQS Records 이벤트 파싱 정상 동작 확인
# ---------------------------------------------------------------------------

class TestSQSRecordsParsing:
    """SQS 트리거 이벤트의 Records[].body가 올바르게 언래핑되는지 확인."""

    @patch("face_analyzer.handler.publish_step_complete")
    @patch("face_analyzer.handler.get_s3_client")
    @patch("face_analyzer.handler.analyze_s3_images", return_value=dict(SAMPLE_RESULT))
    def test_sqs_event_unwraps_records_body(
        self,
        mock_analyze: MagicMock,
        mock_get_s3: MagicMock,
        mock_publish: MagicMock,
    ) -> None:
        """event with 'Records' key is unwrapped correctly — analyze_s3_images
        receives the correct bucket and keys from the inner payload."""
        mock_s3 = _build_mock_s3_client()
        mock_get_s3.return_value = mock_s3

        from face_analyzer.handler import handler

        response = handler(dict(SQS_EVENT), None)

        assert response["statusCode"] == 200

        # analyze_s3_images should be called with the bucket from the inner payload
        mock_analyze.assert_called_once()
        call_args = mock_analyze.call_args
        assert call_args[0][1] == "my-bucket"  # frame_bucket
        assert call_args[0][2] == sorted(FRAME_KEYS)  # keys (sorted)


# ---------------------------------------------------------------------------
# Test: 직접 호출 이벤트 하위 호환성 확인
# ---------------------------------------------------------------------------

class TestDirectInvocationBackwardCompat:
    """Records 키가 없는 직접 호출 이벤트가 기존과 동일하게 동작하는지 확인."""

    @patch("face_analyzer.handler.publish_step_complete")
    @patch("face_analyzer.handler.get_s3_client")
    @patch("face_analyzer.handler.analyze_s3_images", return_value=dict(SAMPLE_RESULT))
    def test_direct_event_works_without_records(
        self,
        mock_analyze: MagicMock,
        mock_get_s3: MagicMock,
        mock_publish: MagicMock,
    ) -> None:
        """event without 'Records' key works as before — direct invocation."""
        mock_s3 = _build_mock_s3_client()
        mock_get_s3.return_value = mock_s3

        from face_analyzer.handler import handler

        response = handler(dict(DIRECT_EVENT), None)

        assert response["statusCode"] == 200

        mock_analyze.assert_called_once()
        call_args = mock_analyze.call_args
        assert call_args[0][1] == "my-bucket"
        assert call_args[0][2] == sorted(FRAME_KEYS)


# ---------------------------------------------------------------------------
# Test: S3에 결과 JSON이 올바른 키로 저장되는지 확인
# ---------------------------------------------------------------------------

class TestS3ResultStorage:
    """분석 결과가 {frame_prefix}face_analysis_result.json 키로 S3에 저장되는지 확인."""

    @patch("face_analyzer.handler.publish_step_complete")
    @patch("face_analyzer.handler.get_s3_client")
    @patch("face_analyzer.handler.analyze_s3_images", return_value=dict(SAMPLE_RESULT))
    def test_result_saved_to_s3_with_correct_key(
        self,
        mock_analyze: MagicMock,
        mock_get_s3: MagicMock,
        mock_publish: MagicMock,
    ) -> None:
        """result_key = {frame_prefix}face_analysis_result.json"""
        mock_s3 = _build_mock_s3_client()
        mock_get_s3.return_value = mock_s3

        from face_analyzer.handler import handler

        handler(dict(DIRECT_EVENT), None)

        expected_key = "sess-1/turn-1/frames/face_analysis_result.json"

        # Verify put_object was called with the correct key
        mock_s3.put_object.assert_called_once()
        put_kwargs = mock_s3.put_object.call_args[1]
        assert put_kwargs["Bucket"] == "my-bucket"
        assert put_kwargs["Key"] == expected_key
        assert put_kwargs["ContentType"] == "application/json"

        # Verify the stored JSON contains the result with session/turn info
        stored_body = json.loads(put_kwargs["Body"])
        assert stored_body["sessionUuid"] == "sess-1"
        assert stored_body["turnId"] == "turn-1"
        assert "metadata" in stored_body
        assert "statistics" in stored_body


# ---------------------------------------------------------------------------
# Test: publish_step_complete의 output_key가 result_key인지 확인
# ---------------------------------------------------------------------------

class TestPublishStepCompleteOutputKey:
    """publish_step_complete가 result_key를 output_key로 전달하는지 확인."""

    @patch("face_analyzer.handler.publish_step_complete")
    @patch("face_analyzer.handler.get_s3_client")
    @patch("face_analyzer.handler.analyze_s3_images", return_value=dict(SAMPLE_RESULT))
    def test_publish_step_complete_uses_result_key(
        self,
        mock_analyze: MagicMock,
        mock_get_s3: MagicMock,
        mock_publish: MagicMock,
    ) -> None:
        """publish_step_complete의 output_key가 result_key인지 확인."""
        mock_s3 = _build_mock_s3_client()
        mock_get_s3.return_value = mock_s3

        from face_analyzer.handler import handler

        handler(dict(DIRECT_EVENT), None)

        expected_result_key = "sess-1/turn-1/frames/face_analysis_result.json"

        mock_publish.assert_called_once_with(
            session_uuid="sess-1",
            turn_id="turn-1",
            step="face_analyzer",
            output_bucket="my-bucket",
            output_key=expected_result_key,
        )
