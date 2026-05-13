"""Tests for _publish_face_trigger() in frame_extractor handler.

Covers:
- Task 1.3: Property test — Face trigger 메시지 필수 필드 검증
- Task 1.4: Unit tests for _publish_face_trigger()
"""

import json
import os
from unittest.mock import MagicMock, patch

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from frame_extractor.handler import _publish_face_trigger


# ---------------------------------------------------------------------------
# Task 1.3 — Property-based test
# ---------------------------------------------------------------------------

# Feature: face-analysis-infra, Property 1: Face trigger message contains all required fields
class TestFaceTriggerMessageProperty:
    """Property 1: Face trigger message contains all required fields.

    **Validates: Requirements 1.2**
    """

    @settings(max_examples=100)
    @given(
        session_uuid=st.text(min_size=1, max_size=100),
        turn_id=st.text(min_size=1, max_size=100),
        frame_bucket=st.text(min_size=1, max_size=200),
        frame_prefix=st.text(min_size=1, max_size=200),
    )
    def test_message_contains_all_required_fields(
        self, session_uuid: str, turn_id: str, frame_bucket: str, frame_prefix: str
    ) -> None:
        """For any valid inputs, the SQS message body SHALL contain
        sessionUuid, turnId, frameBucket, framePrefix with matching values."""
        mock_sqs = MagicMock()

        with (
            patch.dict(os.environ, {"FACE_TRIGGER_SQS_URL": "https://sqs.example.com/queue"}),
            patch("frame_extractor.handler.boto3") as mock_boto3,
        ):
            mock_boto3.client.return_value = mock_sqs

            _publish_face_trigger(session_uuid, turn_id, frame_bucket, frame_prefix)

            mock_sqs.send_message.assert_called_once()
            call_kwargs = mock_sqs.send_message.call_args[1]
            body = json.loads(call_kwargs["MessageBody"])

            assert body["sessionUuid"] == session_uuid
            assert body["turnId"] == turn_id
            assert body["frameBucket"] == frame_bucket
            assert body["framePrefix"] == frame_prefix
            assert set(body.keys()) == {"sessionUuid", "turnId", "frameBucket", "framePrefix"}


# ---------------------------------------------------------------------------
# Task 1.4 — Unit tests
# ---------------------------------------------------------------------------

class TestPublishFaceTriggerUnit:
    """Unit tests for _publish_face_trigger().

    Requirements: 1.3, 1.4
    """

    def test_sqs_url_not_set_skips_publish(self) -> None:
        """When FACE_TRIGGER_SQS_URL is not set, send_message is NOT called."""
        mock_sqs = MagicMock()

        with (
            patch.dict(os.environ, {}, clear=False),
            patch("frame_extractor.handler.boto3") as mock_boto3,
        ):
            # Ensure env var is absent
            os.environ.pop("FACE_TRIGGER_SQS_URL", None)
            mock_boto3.client.return_value = mock_sqs

            _publish_face_trigger("sess-1", "turn-1", "bucket", "prefix/")

            mock_boto3.client.assert_not_called()
            mock_sqs.send_message.assert_not_called()

    def test_sqs_publish_failure_does_not_propagate(self) -> None:
        """When SQS send_message raises, the exception is NOT propagated."""
        mock_sqs = MagicMock()
        mock_sqs.send_message.side_effect = Exception("SQS boom")

        with (
            patch.dict(os.environ, {"FACE_TRIGGER_SQS_URL": "https://sqs.example.com/queue"}),
            patch("frame_extractor.handler.boto3") as mock_boto3,
            patch("frame_extractor.handler.log") as mock_log,
        ):
            mock_boto3.client.return_value = mock_sqs

            # Should NOT raise
            _publish_face_trigger("sess-1", "turn-1", "bucket", "prefix/")

            # Verify the error was logged
            mock_log.exception.assert_called_once()

    def test_normal_publish_sends_correct_message(self) -> None:
        """Normal publish sends correct QueueUrl and MessageBody."""
        mock_sqs = MagicMock()
        queue_url = "https://sqs.us-east-1.amazonaws.com/123456789/face-trigger"

        with (
            patch.dict(os.environ, {"FACE_TRIGGER_SQS_URL": queue_url}),
            patch("frame_extractor.handler.boto3") as mock_boto3,
        ):
            mock_boto3.client.return_value = mock_sqs

            _publish_face_trigger(
                session_uuid="abc-123",
                turn_id="turn-456",
                frame_bucket="my-frame-bucket",
                frame_prefix="abc-123/turn-456/frames/",
            )

            mock_sqs.send_message.assert_called_once()
            call_kwargs = mock_sqs.send_message.call_args[1]

            assert call_kwargs["QueueUrl"] == queue_url

            body = json.loads(call_kwargs["MessageBody"])
            assert body == {
                "sessionUuid": "abc-123",
                "turnId": "turn-456",
                "frameBucket": "my-frame-bucket",
                "framePrefix": "abc-123/turn-456/frames/",
            }
