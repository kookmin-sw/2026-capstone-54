"""SNS → S3 이벤트 파서.

S3 이벤트 알림이 SNS를 경유하면 Lambda에 도착하는 이벤트 구조가 달라진다.
이 모듈은 직접 S3 트리거와 SNS 경유 트리거를 모두 처리하여
통일된 (bucket, key) 리스트를 반환한다.

직접 S3 트리거 구조:
    {"Records": [{"s3": {"bucket": {"name": ...}, "object": {"key": ...}}}]}

SNS 경유 구조:
    {"Records": [{"EventSource": "aws:sns", "Sns": {"Message": "<S3 이벤트 JSON>"}}]}
"""

import json
from typing import NamedTuple

from mefit_video_common.logger import get_logger

log = get_logger(__name__)


class S3Record(NamedTuple):
    bucket: str
    key: str


def parse_s3_records(event: dict) -> list[S3Record]:
    """이벤트에서 S3 레코드를 추출한다. SNS 래핑 여부를 자동 판별."""
    results: list[S3Record] = []

    for record in event.get("Records", []):
        if record.get("EventSource") == "aws:sns":
            message = record.get("Sns", {}).get("Message", "{}")
            try:
                s3_event = json.loads(message)
            except json.JSONDecodeError:
                log.error("sns_message_parse_failed", message=message[:200])
                continue

            for s3_record in s3_event.get("Records", []):
                bucket = s3_record["s3"]["bucket"]["name"]
                key = s3_record["s3"]["object"]["key"]
                results.append(S3Record(bucket=bucket, key=key))
        else:
            bucket = record["s3"]["bucket"]["name"]
            key = record["s3"]["object"]["key"]
            results.append(S3Record(bucket=bucket, key=key))

    log.info("parsed_s3_records", count=len(results))
    return results
