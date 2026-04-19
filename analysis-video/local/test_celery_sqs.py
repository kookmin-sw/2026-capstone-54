#!/usr/bin/env python3
"""LocalStack SQS → Celery worker 통합 검증 스크립트.

사용법:
    python test_celery_sqs.py

LocalStack이 실행 중이어야 합니다 (docker compose up).
mefit-video-step-complete 큐에 Celery 프로토콜 형식 메시지를 넣고,
sqs-celery-worker가 소비하는지 확인합니다.
"""

import base64
import json
import sys
import time
import uuid

import boto3

ENDPOINT_URL = "http://localhost:4566"
REGION = "us-east-1"
QUEUE_NAME = "mefit-video-step-complete"
TASK_NAME = "interviews.tasks.process_video_step_complete.process_video_step_complete"


def get_queue_url(sqs):
    resp = sqs.get_queue_url(QueueName=QUEUE_NAME)
    return resp["QueueUrl"]


def build_celery_message(kwargs: dict) -> str:
    task_id = str(uuid.uuid4())
    body_raw = json.dumps(
        [
            [],
            kwargs,
            {"callbacks": None, "errbacks": None, "chain": None, "chord": None},
        ]
    )
    body_b64 = base64.b64encode(body_raw.encode()).decode()

    return json.dumps(
        {
            "body": body_b64,
            "content-encoding": "utf-8",
            "content-type": "application/json",
            "headers": {
                "lang": "py",
                "task": TASK_NAME,
                "id": task_id,
                "shadow": None,
                "eta": None,
                "expires": None,
                "group": None,
                "group_index": None,
                "retries": 0,
                "timelimit": [None, None],
                "root_id": task_id,
                "parent_id": None,
                "argsrepr": "()",
                "kwargsrepr": repr(kwargs),
                "origin": "test@local",
            },
            "properties": {
                "correlation_id": task_id,
                "reply_to": "",
                "delivery_mode": 2,
                "delivery_info": {
                    "exchange": "",
                    "routing_key": "mefit-video-step-complete",
                },
                "priority": 0,
                "body_encoding": "base64",
                "delivery_tag": str(uuid.uuid4()),
            },
        }
    )


def main():
    sqs = boto3.client("sqs", endpoint_url=ENDPOINT_URL, region_name=REGION)

    try:
        queue_url = get_queue_url(sqs)
    except Exception as e:
        print(f"[FAIL] Queue not found: {e}")
        print(
            "       Start LocalStack first: cd analysis-video/local && docker compose up"
        )
        sys.exit(1)

    print(f"[OK] Queue URL: {queue_url}")

    test_kwargs = {
        "session_uuid": "test-session-00000000-0000-0000-0000-000000000001",
        "turn_id": "999",
        "step": "video_converter",
        "output_bucket": "pj-kmucd1-04-mefit-scaled-video-files",
        "output_key": "test-session/999/test.mp4",
    }

    message_body = build_celery_message(test_kwargs)
    print(f"\n[SEND] Publishing Celery task message to SQS...")
    print(f"       task: {TASK_NAME}")
    print(f"       kwargs: {test_kwargs}")

    sqs.send_message(QueueUrl=queue_url, MessageBody=message_body)
    print("[OK] Message sent to SQS")

    print("\n[CHECK] Verifying message is in queue...")
    time.sleep(1)

    attrs = sqs.get_queue_attributes(
        QueueUrl=queue_url, AttributeNames=["ApproximateNumberOfMessages"]
    )
    count = attrs["Attributes"]["ApproximateNumberOfMessages"]
    print(f"[INFO] Messages in queue: {count}")

    if int(count) > 0:
        print("\n[OK] Message is waiting in SQS.")
        print("     Start sqs-celery-worker to consume it:")
        print("     cd backend && docker compose --profile sqs up sqs-celery-worker")
        print("\n     Or manually consume (for testing):")
        print(
            "     cd backend && celery -A config.celery_sqs worker -Q mefit-video-step-complete -l INFO"
        )
    else:
        print("\n[INFO] Message was already consumed (worker is running).")
        print("       Check worker logs for 'Step complete' or 'Recording not found'.")


if __name__ == "__main__":
    main()
