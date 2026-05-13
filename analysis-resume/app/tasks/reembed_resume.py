"""bundle URL 에서 정규화 이력서 JSON 을 받아 섹션별 임베딩만 재생성하는 태스크.

structured 모드 생성 또는 사용자가 '최종 저장' 을 누른 시점에 호출된다.
LLM 분석은 이미 끝난 상태이거나 사용자가 직접 입력했으므로 다시 수행하지 않는다.

backend 는 dispatch 시 `bundle_url` (S3/S3Mock URL) 만 넘기고, 이 task 가 fetch 해서
finalize_resume_task 의 `_collect_structured_chunks(parsed_data)` 와 동일한 방식으로
섹션별 임베딩을 생성한 뒤 backend 의 `resumes.tasks.apply_analysis_result` 로 전달한다.
"""

from __future__ import annotations

import io
import json
from typing import Any
from urllib.parse import urlparse

import boto3

from app import config
from app.celery_app import app
from app.common import embed_texts
from app.tasks.finalize_resume import _collect_structured_chunks
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _fetch_bundle_json(bundle_url: str) -> dict:
  """bundle URL 에서 JSON 을 다운로드한다.

  - S3Mock / AWS S3: boto3 로 GetObject
  - 로컬 file:// 또는 상대 경로(media/...): 같은 컨테이너 내 파일 시스템에서 직접 읽기
  """
  if bundle_url.startswith("http://") or bundle_url.startswith("https://"):
    return _fetch_s3_url(bundle_url)
  if bundle_url.startswith("/"):
    # backend webapp media 경로 (개발 환경에서 default_storage url 가 절대 경로일 수도)
    with open(bundle_url, "rb") as f:
      return json.loads(f.read())
  raise ValueError(f"지원하지 않는 bundle_url 스킴: {bundle_url}")


def _fetch_s3_url(url: str) -> dict:
  """S3 (또는 S3Mock) URL 에서 객체를 다운로드해 JSON 으로 파싱."""
  parsed = urlparse(url)
  # 호스트 first-segment 가 버킷일 수도 (path-style) 있고, 호스트가 버킷.endpoint 일 수도 있음.
  # 가장 흔한 path-style 부터 시도.
  bucket = config.S3_BUCKET_NAME
  key = parsed.path.lstrip("/")
  # url 에 버킷 이름이 prefix 로 포함된 경우 (예: /mefit-files/resume_bundles/xxx.json)
  if key.startswith(f"{bucket}/"):
    key = key[len(bucket) + 1:]

  s3_kwargs: dict[str, Any] = {"region_name": config.S3_REGION_NAME}
  if config.S3_ENDPOINT_URL:
    s3_kwargs["endpoint_url"] = config.S3_ENDPOINT_URL
  if config.S3_ACCESS_KEY_ID:
    s3_kwargs["aws_access_key_id"] = config.S3_ACCESS_KEY_ID
    s3_kwargs["aws_secret_access_key"] = config.S3_SECRET_ACCESS_KEY

  s3 = boto3.client("s3", **s3_kwargs)
  obj = s3.get_object(Bucket=bucket, Key=key)
  return json.loads(obj["Body"].read().decode("utf-8"))


@app.task(bind=True, name="analysis_resume.tasks.reembed_resume", max_retries=2, default_retry_delay=30)
def reembed_resume_task(self, resume_uuid: str, user_id: int, bundle_url: str) -> dict:
  """bundle_url 에서 parsed_data 를 가져와 섹션별 임베딩을 생성한다."""
  logger.info("재임베딩 시작", resume_uuid=resume_uuid, bundle_url=bundle_url)

  app.send_task(
    "resumes.tasks.update_resume_step",
    queue="celery",
    kwargs={"resume_uuid": resume_uuid, "step": "embedding"},
  )

  try:
    bundle = _fetch_bundle_json(bundle_url)
    parsed_data: dict = bundle.get("parsed_data") or {}

    chunks = _collect_structured_chunks(parsed_data)
    embeddings: list[dict] = []
    extra_embed_tokens = 0

    if chunks:
      contexts = [c["context"] for c in chunks]
      vectors, tokens = embed_texts(contexts)
      extra_embed_tokens += tokens
      for idx, (chunk, vec) in enumerate(zip(chunks, vectors)):
        embeddings.append(
          {
            "context": chunk["context"],
            "vector": vec,
            "chunk_type": chunk["chunk_type"],
            "chunk_index": idx,
          }
        )

    token_usages: list[dict] = []
    if extra_embed_tokens > 0:
      token_usages.append(
        {
          "operation_type": "embed",
          "model_name": config.OPENAI_EMBEDDING_MODEL,
          "prompt_tokens": extra_embed_tokens,
          "total_tokens": extra_embed_tokens,
        }
      )

    # backend 로 전송: parsed_data 는 이미 sub-model 에 저장되어 있으므로 None 으로 두고
    # embeddings + token_usages 만 새로 적용하도록 한다.
    app.send_task(
      "resumes.tasks.apply_analysis_result",
      queue="celery",
      kwargs={
        "resume_uuid": resume_uuid,
        "parsed_data": None,
        "embeddings": embeddings,
        "file_text_content": None,
        "token_usages": token_usages,
      },
    )

    logger.info("재임베딩 완료", resume_uuid=resume_uuid, embeddings=len(embeddings))
    return {"resume_uuid": resume_uuid, "embeddings": len(embeddings)}

  except Exception as exc:
    logger.error("재임베딩 실패", resume_uuid=resume_uuid, error=str(exc), exc_info=True)
    app.send_task(
      "resumes.tasks.mark_resume_failed",
      queue="celery",
      kwargs={"resume_uuid": resume_uuid, "error": str(exc)},
    )
    raise self.retry(exc=exc)
