"""Celery 프로토콜 v2 형식으로 SQS에 태스크 메시지를 발행한다.

Lambda 환경에는 celery 패키지가 없으므로, 메시지 프로토콜을 직접 구성한다.
kombu SQS transport가 이 형식을 인식하여 Celery worker에 전달한다.
"""

import base64
import json
import uuid

import boto3
from mefit_video_common.config import REGION, SQS_ENDPOINT_URL, STEP_COMPLETE_SQS_URL
from mefit_video_common.logger import get_logger

log = get_logger(__name__)

TASK_NAME = "interviews.tasks.process_video_step_complete.process_video_step_complete"

_client = None


def _get_sqs_client():
    global _client
    if _client is None:
        kwargs = {"region_name": REGION}
        if SQS_ENDPOINT_URL:
            kwargs["endpoint_url"] = SQS_ENDPOINT_URL
        _client = boto3.client("sqs", **kwargs)
    return _client


def _build_celery_message(task_name: str, kwargs: dict) -> str:
    task_id = str(uuid.uuid4())
    body_raw = json.dumps(
        [
            [],
            kwargs,
            {"callbacks": None, "errbacks": None, "chain": None, "chord": None},
        ]
    )
    body_b64 = base64.b64encode(body_raw.encode()).decode()

    message = {
        "body": body_b64,
        "content-encoding": "utf-8",
        "content-type": "application/json",
        "headers": {
            "lang": "py",
            "task": task_name,
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
            "origin": "lambda@mefit",
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
    return json.dumps(message)


def publish_step_complete(
    *,
    session_uuid: str,
    turn_id: str,
    step: str,
    output_bucket: str,
    output_key: str,
) -> None:
    if not STEP_COMPLETE_SQS_URL:
        log.info("sqs_skip", reason="STEP_COMPLETE_SQS_URL not set")
        return

    kwargs = {
        "session_uuid": session_uuid,
        "turn_id": turn_id,
        "step": step,
        "output_bucket": output_bucket,
        "output_key": output_key,
    }

    message_body = _build_celery_message(TASK_NAME, kwargs)

    _get_sqs_client().send_message(
        QueueUrl=STEP_COMPLETE_SQS_URL,
        MessageBody=message_body,
    )
    log.info(
        "celery_task_published", step=step, session_uuid=session_uuid, turn_id=turn_id
    )
