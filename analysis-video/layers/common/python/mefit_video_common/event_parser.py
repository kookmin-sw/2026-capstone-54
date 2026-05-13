"""S3 이벤트 파서 — 직접 / SNS 경유 / SQS→SNS 경유 자동 판별.

지원하는 이벤트 구조:

1. 직접 S3 → Lambda:
   {"Records": [{"s3": {"bucket": {"name": ...}, "object": {"key": ...}}}]}

2. S3 → SNS → Lambda:
   {"Records": [{"EventSource": "aws:sns", "Sns": {"Message": "<S3 JSON>"}}]}

3. S3 → SNS → SQS → Lambda:
   {"Records": [{"eventSource": "aws:sqs", "body": "<SNS Notification JSON>"}]}
   body 내부: {"Type": "Notification", "Message": "<S3 JSON>"}
"""

import json
from typing import NamedTuple

from mefit_video_common.logger import get_logger

log = get_logger(__name__)


class S3Record(NamedTuple):
    bucket: str
    key: str


def _extract_s3_records(s3_event: dict) -> list[S3Record]:
    results = []
    for rec in s3_event.get("Records", []):
        try:
            results.append(
                S3Record(
                    bucket=rec["s3"]["bucket"]["name"],
                    key=rec["s3"]["object"]["key"],
                )
            )
        except (KeyError, TypeError):
            log.error("s3_record_parse_failed", record=str(rec)[:200])
    return results


def parse_s3_records(event: dict) -> list[S3Record]:
    results: list[S3Record] = []

    for record in event.get("Records", []):
        source = record.get("eventSource") or record.get("EventSource") or ""

        if source == "aws:sqs":
            body_str = record.get("body", "{}")
            try:
                body = json.loads(body_str)
            except json.JSONDecodeError:
                log.error("sqs_body_parse_failed", body=body_str[:200])
                continue

            if body.get("Type") == "Notification":
                message_str = body.get("Message", "{}")
                try:
                    s3_event = json.loads(message_str)
                except json.JSONDecodeError:
                    log.error("sns_message_parse_failed", message=message_str[:200])
                    continue
                results.extend(_extract_s3_records(s3_event))
            else:
                results.extend(_extract_s3_records(body))

        elif source == "aws:sns":
            message_str = record.get("Sns", {}).get("Message", "{}")
            try:
                s3_event = json.loads(message_str)
            except json.JSONDecodeError:
                log.error("sns_message_parse_failed", message=message_str[:200])
                continue
            results.extend(_extract_s3_records(s3_event))

        elif "s3" in record:
            results.extend(_extract_s3_records({"Records": [record]}))

        else:
            log.warning(
                "unknown_record_source", source=source, keys=list(record.keys())[:5]
            )

    log.info("parsed_s3_records", count=len(results))
    return results
