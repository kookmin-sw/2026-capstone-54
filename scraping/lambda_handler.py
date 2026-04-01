"""
AWS Lambda 진입점.

호출 예시 (event):
    {"url": "https://www.jobplanet.co.kr/job/search?posting_ids%5B%5D=1312777"}

환경 변수 (Lambda 콘솔에서 설정):
    OPENAI_API_KEY  : OpenAI API 키
    S3_BUCKET       : 결과를 저장할 S3 버킷명 (미설정 시 response body로만 반환)
    LOG_LEVEL       : 로그 레벨 (기본 INFO)
"""

import asyncio
import json
import os

import boto3

import pipeline
from utils.browser import create_browser
from utils.logger import get_logger

logger = get_logger(__name__)

_s3 = boto3.client("s3") if os.getenv("S3_BUCKET") else None


async def _scrape(url: str) -> dict:
    async with create_browser() as browser:
        job_posting = await pipeline.run(url, browser)
        return job_posting.to_dict()


def handler(event: dict, context) -> dict:
    """
    Lambda 핸들러.

    Args:
        event:   {"url": "<채용공고 URL>"}
        context: Lambda 실행 컨텍스트 (AWS 자동 전달)

    Returns:
        {"statusCode": 200, "body": {...결과...}}
    """
    url = event.get("url", "").strip()
    if not url:
        return {"statusCode": 400, "body": {"error": "url 파라미터가 필요합니다."}}

    logger.info("Lambda 스크래핑 시작: %s", url)

    try:
        result = asyncio.run(_scrape(url))
    except Exception as e:
        logger.error("스크래핑 실패: %s", e, exc_info=True)
        return {"statusCode": 500, "body": {"error": str(e)}}

    # S3_BUCKET 환경 변수가 있으면 결과를 S3에도 저장
    bucket = os.getenv("S3_BUCKET")
    if bucket and _s3:
        platform = result.get("platform", "unknown")
        request_id = getattr(context, "aws_request_id", "local")
        key = f"results/{platform}/{request_id}.json"
        try:
            _s3.put_object(
                Bucket=bucket,
                Key=key,
                Body=json.dumps(result, ensure_ascii=False),
                ContentType="application/json",
            )
            logger.info("S3 저장 완료: s3://%s/%s", bucket, key)
            result["s3_key"] = key
        except Exception as e:
            logger.warning("S3 저장 실패 (결과는 반환): %s", e)

    logger.info("Lambda 스크래핑 완료: title='%s'", result.get("title", ""))
    return {"statusCode": 200, "body": result}
