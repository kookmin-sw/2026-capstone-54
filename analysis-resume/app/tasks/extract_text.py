"""PDF 텍스트 추출 Celery task."""

import io

import boto3
from pypdf import PdfReader

from app import config, db
from app.celery_app import app
from app.utils.logger import get_logger

logger = get_logger(__name__)

_s3_client = None


def _get_s3_client():
  global _s3_client
  if _s3_client is None:
    kwargs = {
      "region_name": config.S3_REGION_NAME,
    }
    # 개발: S3Mock 사용 시 endpoint_url + 명시적 키 필요
    # 운영: 미설정 시 EC2 인스턴스 프로파일(IAM Role)로 자동 인증
    if config.S3_ENDPOINT_URL:
      kwargs["endpoint_url"] = config.S3_ENDPOINT_URL
    if config.S3_ACCESS_KEY_ID:
      kwargs["aws_access_key_id"] = config.S3_ACCESS_KEY_ID
      kwargs["aws_secret_access_key"] = config.S3_SECRET_ACCESS_KEY
    _s3_client = boto3.client("s3", **kwargs)
  return _s3_client


def _read_pdf_bytes(storage_path: str) -> bytes:
  s3 = _get_s3_client()
  response = s3.get_object(Bucket=config.S3_BUCKET_NAME, Key=storage_path)
  return response["Body"].read()


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
  reader = PdfReader(io.BytesIO(pdf_bytes))
  pages = [page.extract_text() or "" for page in reader.pages]
  return "\n".join(pages).strip()


@app.task(bind=True, name="store_resume.tasks.extract_text", max_retries=2, default_retry_delay=30)
def extract_text_task(self, resume_uuid: str, user_id: int, storage_path: str) -> dict:
  """PDF에서 텍스트를 추출하여 resume_file_contents.content에 저장합니다."""
  logger.info("PDF 텍스트 추출 시작", resume_uuid=resume_uuid)

  try:
    db.update_resume_step(resume_uuid=resume_uuid, step="extracting_text")
    pdf_bytes = _read_pdf_bytes(storage_path)
    text = extract_text_from_pdf(pdf_bytes)

    if not text:
      raise ValueError("PDF에서 텍스트를 추출할 수 없습니다.")

    db.update_file_content_text(resume_uuid=resume_uuid, extracted_text=text)
    logger.info("PDF 텍스트 추출 완료", resume_uuid=resume_uuid, text_len=len(text))

    return {"resume_uuid": resume_uuid, "user_id": user_id, "text": text}

  except Exception as exc:
    logger.error("PDF 텍스트 추출 실패", resume_uuid=resume_uuid, error=str(exc), exc_info=True)
    db.update_resume_status(resume_uuid=resume_uuid, status="failed")
    raise self.retry(exc=exc)
