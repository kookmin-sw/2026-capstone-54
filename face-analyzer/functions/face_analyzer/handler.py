"""face-analyzer Lambda: 얼굴 표정 분석.

Django Celery worker에서 동기 호출(RequestResponse)로 사용한다.

입력:
  {
    "frameBucket": "pj-kmucd1-04-mefit-video-frame-files",
    "framePrefix": "session-uuid/turn-id/frames/",
    "sessionUuid": "session-uuid",
    "turnId": "turn-id"
  }

출력:
  {"statusCode": 200, "body": "{\"metadata\": ..., \"frames\": [...], \"statistics\": {...}}"}
"""

from __future__ import annotations

import json
import os

from mefit_video_common.config import FRAME_BUCKET, REGION
from mefit_video_common.logger import get_logger
from mefit_video_common.s3_client import get_s3_client
from mefit_video_common.celery_publisher import publish_step_complete

from analyzer.batch_processor import analyze_s3_images

log = get_logger(__name__)


def handler(event, context):
    # SQS 트리거 이벤트 처리: Records[].body에서 실제 페이로드 추출
    if "Records" in event:
        record = event["Records"][0]
        event = json.loads(record["body"])

    frame_bucket = event.get("frameBucket", FRAME_BUCKET)
    frame_prefix = event.get("framePrefix", "")
    session_uuid = event.get("sessionUuid", "")
    turn_id = event.get("turnId", "")

    if not frame_prefix:
        return {"statusCode": 400, "body": json.dumps({"error": "Missing framePrefix"})}

    keys = _list_frame_keys(frame_bucket, frame_prefix)

    if not keys:
        return {
            "statusCode": 404,
            "body": json.dumps({"error": "No frames found", "prefix": frame_prefix}),
        }

    log.info(
        "face_analysis_start",
        session_uuid=session_uuid,
        turn_id=turn_id,
        frame_count=len(keys),
    )

    s3_client = get_s3_client()
    result = analyze_s3_images(s3_client, frame_bucket, keys)
    result["sessionUuid"] = session_uuid
    result["turnId"] = turn_id

    # 결과를 S3에 JSON으로 저장 (frames 배열 포함 전체 결과)
    result_key = f"{frame_prefix}face_analysis_result.json"
    s3_client.put_object(
        Bucket=frame_bucket,
        Key=result_key,
        Body=json.dumps(result, ensure_ascii=False),
        ContentType="application/json",
    )

    # step-complete 발행: output_key로 결과 JSON의 S3 키 전달
    if session_uuid and turn_id:
        publish_step_complete(
            session_uuid=session_uuid,
            turn_id=turn_id,
            step="face_analyzer",
            output_bucket=frame_bucket,
            output_key=result_key,
        )

    log.info(
        "face_analysis_complete",
        session_uuid=session_uuid,
        turn_id=turn_id,
        frame_count=len(keys),
    )

    return {"statusCode": 200, "body": json.dumps(result, ensure_ascii=False)}


def _list_frame_keys(bucket: str, prefix: str) -> list[str]:
    keys: list[str] = []
    s3 = get_s3_client()
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            if key.lower().endswith((".jpg", ".jpeg", ".png")):
                keys.append(key)
    return sorted(keys)
