"""
AWS Lambda 핸들러 — 얼굴 표정 분석.

입력 이벤트:
  {
    "bucket": "mefit-frames",
    "prefix": "session-uuid/turn-id/frames/",
    "keys": ["session-uuid/turn-id/frames/frame_00001.jpg", ...]  // optional
  }

출력:
  {"metadata": {...}, "frames": [{...}, ...], "statistics": {...}}
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List

import boto3

from analyzer.batch_processor import analyze_s3_images

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

s3_client = boto3.client("s3")
RESULT_BUCKET = os.environ.get("RESULT_BUCKET", "")


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda 엔트리포인트."""
    bucket = event.get("bucket", "")
    prefix = event.get("prefix", "")
    keys: List[str] = event.get("keys", [])

    if not bucket:
        return {"error": "Missing 'bucket' in event"}

    if not keys and prefix:
        keys = _list_s3_keys(bucket, prefix)

    if not keys:
        return {"error": "No image keys found", "bucket": bucket, "prefix": prefix}

    logger.info("Starting face analysis: bucket=%s, image_count=%d", bucket, len(keys))

    result = analyze_s3_images(s3_client, bucket, keys)

    if RESULT_BUCKET and prefix:
        result_key = f"{prefix.rstrip('/')}/_analysis_result.json"
        try:
            s3_client.put_object(
                Bucket=RESULT_BUCKET,
                Key=result_key,
                Body=json.dumps(result, ensure_ascii=False, indent=2),
                ContentType="application/json",
            )
            result["result_s3_path"] = f"s3://{RESULT_BUCKET}/{result_key}"
        except Exception as e:
            logger.error("Failed to save result to S3: %s", e)
            result["result_save_error"] = str(e)[:200]

    return result


def _list_s3_keys(bucket: str, prefix: str) -> List[str]:
    """S3 prefix 하위의 모든 이미지 키를 조회."""
    keys: List[str] = []
    paginator = s3_client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            if key.lower().endswith((".jpg", ".jpeg", ".png")):
                keys.append(key)
    return sorted(keys)
