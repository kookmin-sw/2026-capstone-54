"""
analysis 서비스 환경 변수 설정.

DATABASE_URL, REDIS_URL, OPENAI_API_KEY, OPENAI_MODEL 등
서비스 실행에 필요한 설정값을 환경 변수에서 로드한다.
"""

import os

DATABASE_URL: str = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/team_four_db"
)
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
FILE_STORAGE_TYPE: str = os.getenv("FILE_STORAGE_TYPE", "local")
MEDIA_ROOT: str = os.getenv("MEDIA_ROOT", "/app/media")
