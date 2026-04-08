"""
전역 설정 모듈.
환경 변수 및 상수를 한 곳에서 관리합니다.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# 프로젝트 루트
BASE_DIR = Path(__file__).parent.parent

# ── Celery ──────────────────────────────────────
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

# ── Database (backend/ DB에 직접 접근) ────────────
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
DB_NAME = os.getenv("DATABASE_NAME", "mefit")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

# SQLAlchemy용 DATABASE_URL
# 운영: AWS RDS → 환경변수로 주입 (sslmode 등 필요 시 DATABASE_URL에 포함)
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
)

# ── OpenAI ───────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
OPENAI_EMBEDDING_DIMENSIONS = 1536
OPENAI_LLM_MODEL = os.getenv("OPENAI_LLM_MODEL", "gpt-4o-mini")

# ── 텍스트 처리 ──────────────────────────────────
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "500"))      # 청크당 최대 글자 수
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50")) # 청크 간 겹침 글자 수
LLM_MAX_TEXT_CHARS = int(os.getenv("LLM_MAX_TEXT_CHARS", "8000"))

# ── S3 / 파일 스토리지 ───────────────────────────
# 개발: S3_ENDPOINT_URL=http://mefit-s3mock:9090  (mefit-local 네트워크 내 S3Mock)
# 운영: S3_ENDPOINT_URL 미설정                    (boto3 기본값 → 실제 AWS S3)
# 운영: AWS 키 미설정 → EC2 인스턴스 프로파일(IAM Role)로 자동 인증
S3_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME", "mefit-files")
S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", "us-east-1")
S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL", "") or None  # None이면 실제 AWS
S3_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "") or None    # None이면 인스턴스 프로파일
S3_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "") or None

# ── 로그 레벨 ────────────────────────────────────
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
