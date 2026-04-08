"""
전역 설정 모듈.
환경 변수 및 상수를 한 곳에서 관리합니다.
"""

from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

# 프로젝트 루트
BASE_DIR = Path(__file__).parent

# 출력 디렉토리
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# 브라우저 설정
BROWSER_TIMEOUT_MS = 30_000        # 페이지 로드 타임아웃 (ms)
ELEMENT_WAIT_TIMEOUT_MS = 10_000   # 요소 대기 타임아웃 (ms)
NAVIGATION_TIMEOUT_MS = 60_000     # 전체 내비게이션 타임아웃 (ms)

# HTTP 요청 설정
HTTP_TIMEOUT_SECONDS = 15
HTTP_MAX_RETRIES = 2

# 봇 탐지 회피 설정
RANDOM_DELAY_MIN_MS = 500   # 액션 사이 최소 딜레이 (ms)
RANDOM_DELAY_MAX_MS = 1500  # 액션 사이 최대 딜레이 (ms)

# Headless 모드 (운영 환경에서는 True)
HEADLESS = os.getenv("HEADLESS", "true").lower() == "true"

# 로그 레벨
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# OpenAI 설정
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_VISION_MODEL = os.getenv("OPENAI_VISION_MODEL", "gpt-4o")  # 이미지 공고 추출용

# LLM 추출 설정
LLM_MAX_TEXT_CHARS = int(os.getenv("LLM_MAX_TEXT_CHARS", "10000"))  # HTML에서 추출한 텍스트 최대 길이

# ── Database (backend/ job_descriptions 테이블에 직접 저장) ──
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
DB_NAME = os.getenv("DATABASE_NAME", "team_four_db")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")

# SQLAlchemy용 DATABASE_URL
# 운영: AWS RDS → 환경변수로 주입 (sslmode 등 필요 시 DATABASE_URL에 포함)
DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
)
