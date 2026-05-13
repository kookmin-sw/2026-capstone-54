"""
이력서·채용공고 콘텐츠 조회 유틸리티.

이력서 콘텐츠는 backend 가 생성한 정규화 bundle JSON (S3/S3Mock URL) 에서 가져온다.
DB 직접 조회 경로는 더 이상 사용하지 않는다 — backend 의 분석 플로우 단일 진입점이
정규화 sub-model 이기 때문에 어떤 source mode 이든 동일한 구조를 받는다.

채용공고는 여전히 DB 직접 조회를 유지한다 (별도 정규화 작업 전).
"""

from __future__ import annotations

import json
import logging
from typing import Any
from urllib.parse import urlparse

import boto3

from config import (
    S3_ACCESS_KEY_ID,
    S3_BUCKET_NAME,
    S3_ENDPOINT_URL,
    S3_REGION_NAME,
    S3_SECRET_ACCESS_KEY,
)
from db.models import JobDescriptionTable, UserJobDescriptionTable

logger = logging.getLogger(__name__)


def _fetch_bundle_json(bundle_url: str) -> dict:
    """bundle URL 에서 JSON 을 다운로드한다.

    - S3Mock / AWS S3: boto3 GetObject (path-style)
    - 로컬 파일 경로: 직접 read
    """
    if not bundle_url:
        return {}

    if bundle_url.startswith("http://") or bundle_url.startswith("https://"):
        return _fetch_s3_url(bundle_url)
    if bundle_url.startswith("/"):
        with open(bundle_url, "rb") as f:
            return json.loads(f.read())
    raise ValueError(f"지원하지 않는 bundle_url 스킴: {bundle_url}")


def _fetch_s3_url(url: str) -> dict:
    parsed = urlparse(url)
    bucket = S3_BUCKET_NAME
    key = parsed.path.lstrip("/")
    if key.startswith(f"{bucket}/"):
        key = key[len(bucket) + 1 :]

    s3_kwargs: dict[str, Any] = {"region_name": S3_REGION_NAME}
    if S3_ENDPOINT_URL:
        s3_kwargs["endpoint_url"] = S3_ENDPOINT_URL
    if S3_ACCESS_KEY_ID:
        s3_kwargs["aws_access_key_id"] = S3_ACCESS_KEY_ID
        s3_kwargs["aws_secret_access_key"] = S3_SECRET_ACCESS_KEY

    s3 = boto3.client("s3", **s3_kwargs)
    obj = s3.get_object(Bucket=bucket, Key=key)
    return json.loads(obj["Body"].read().decode("utf-8"))


def get_resume_content(bundle_url: str) -> str:
    """bundle URL 에서 이력서 정규화 정보를 LLM 친화적인 JSON 문자열로 반환한다.

    bundle 은 backend 의 `ResumeParsedDataBundleService.build_dict()` 결과이며 다음 키를
    포함한다: `resume`(메타), `parsed_data`(정규화 sub-model), `raw`(원문).
    LLM 은 정규화 dict 를 그대로 받아 추론할 수 있다.
    """
    if not bundle_url:
        logger.warning("bundle_url 이 비어 있어 이력서 콘텐츠를 빈 문자열로 반환")
        return ""

    try:
        bundle = _fetch_bundle_json(bundle_url)
    except Exception as exc:
        logger.exception("bundle 다운로드 실패: %s — %s", bundle_url, exc)
        return ""

    return json.dumps(bundle, ensure_ascii=False, indent=2, default=str)


def get_job_description_content(session, user_job_description_id: str) -> str:
    """user_job_description_id(UUID)로 채용공고 내용을 JSON 문자열로 반환한다."""
    if not user_job_description_id:
        return ""

    ujd = (
        session.query(UserJobDescriptionTable)
        .filter(UserJobDescriptionTable.uuid == user_job_description_id)
        .first()
    )
    if not ujd:
        logger.warning(
            "UserJobDescription을 찾을 수 없습니다: id=%s", user_job_description_id
        )
        return ""

    jd = (
        session.query(JobDescriptionTable)
        .filter(JobDescriptionTable.id == ujd.job_description_id)
        .first()
    )
    if not jd:
        logger.warning(
            "JobDescription을 찾을 수 없습니다: id=%d", ujd.job_description_id
        )
        return ""

    data = {
        "company": jd.company or "",
        "title": jd.title or "",
        "platform": jd.platform or "",
        "duties": jd.duties or "",
        "requirements": jd.requirements or "",
        "preferred": jd.preferred or "",
        "work_type": jd.work_type or "",
        "salary": jd.salary or "",
        "location": jd.location or "",
        "education": jd.education or "",
        "experience": jd.experience or "",
    }
    return json.dumps(data, ensure_ascii=False, indent=2)
