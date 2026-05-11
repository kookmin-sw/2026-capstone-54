"""Local worker that simulates AWS Lambda's SQS event source mapping.

face-analyzer is deployed as an AWS Lambda triggered by SQS event source mapping.
This poller calls the same `handler(event, context)` with the exact `Records`
event shape Lambda would deliver, so handler code runs identically locally and
in production.

Reference: https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html
"""

from __future__ import annotations

import logging
import os
import signal
import sys
import time
from typing import Any

import boto3

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/lambda-layers/python")

from functions.face_analyzer.handler import handler  # noqa: E402

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("face-analyzer-poller")

QUEUE_URL = os.environ["FACE_TRIGGER_SQS_URL"]
ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL", "")
REGION = os.environ.get("REGION") or os.environ.get("AWS_DEFAULT_REGION", "us-east-1")

_sqs_kwargs: dict[str, Any] = {"region_name": REGION}
if ENDPOINT_URL:
    _sqs_kwargs["endpoint_url"] = ENDPOINT_URL

sqs = boto3.client("sqs", **_sqs_kwargs)

_running = True


def _shutdown(signum: int, _frame) -> None:
    global _running
    log.info("shutdown_signal_received signal=%s", signum)
    _running = False


signal.signal(signal.SIGTERM, _shutdown)
signal.signal(signal.SIGINT, _shutdown)


def _build_lambda_sqs_event(message: dict[str, Any]) -> dict[str, Any]:
    return {
        "Records": [
            {
                "messageId": message["MessageId"],
                "receiptHandle": message["ReceiptHandle"],
                "body": message["Body"],
                "attributes": message.get("Attributes", {}),
                "messageAttributes": message.get("MessageAttributes", {}),
                "md5OfBody": message.get("MD5OfBody", ""),
                "eventSource": "aws:sqs",
                "eventSourceARN": f"arn:aws:sqs:{REGION}:000000000000:mefit-face-trigger",
                "awsRegion": REGION,
            }
        ]
    }


def _process_one(message: dict[str, Any]) -> None:
    message_id = message["MessageId"]
    receipt_handle = message["ReceiptHandle"]
    event = _build_lambda_sqs_event(message)

    log.info("invoking_handler messageId=%s body=%s", message_id, message["Body"][:200])
    try:
        result = handler(event, None)
    except Exception as exc:
        log.exception("handler_failed messageId=%s error=%s", message_id, exc)
        return

    status = result.get("statusCode") if isinstance(result, dict) else "unknown"
    log.info("handler_completed messageId=%s status=%s", message_id, status)
    sqs.delete_message(QueueUrl=QUEUE_URL, ReceiptHandle=receipt_handle)
    log.info("message_deleted messageId=%s", message_id)


def main() -> None:
    log.info(
        "face_analyzer_poller_start queue=%s endpoint=%s",
        QUEUE_URL,
        ENDPOINT_URL or "<aws>",
    )
    while _running:
        try:
            response = sqs.receive_message(
                QueueUrl=QUEUE_URL,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,
                MessageAttributeNames=["All"],
                AttributeNames=["All"],
            )
            for msg in response.get("Messages", []):
                if not _running:
                    break
                _process_one(msg)
        except Exception as exc:
            log.exception("polling_error error=%s", exc)
            time.sleep(5)

    log.info("face_analyzer_poller_stopped")


if __name__ == "__main__":
    main()
