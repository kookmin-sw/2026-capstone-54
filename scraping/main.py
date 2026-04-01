"""
채용 공고 스크래퍼 — 로컬 CLI 진입점.

사용법:
    uv run main.py <URL>
    uv run main.py <URL> --output results/my_job.json
    uv run main.py <URL> --no-headless   # 브라우저 창 표시 (디버깅용)

출력:
    output/ 디렉토리에 JSON 파일로 저장되고, 터미널에도 출력됩니다.

참고:
    Celery Worker 환경에서의 스크래핑은 tasks.py 를 통해 실행됩니다.
    실제 스크래핑 로직은 scraper.run_scraping() 에 정의되어 있으며 두 환경이 동일합니다.
"""

import argparse
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

from config import OUTPUT_DIR
from scraper import run_scraping
from utils.browser import create_browser
from utils.logger import get_logger

logger = get_logger(__name__)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="채용 공고 URL을 스크래핑하여 JSON으로 저장합니다.",
    )
    parser.add_argument("url", help="스크래핑할 채용 공고 URL")
    parser.add_argument(
        "--output", "-o",
        help="결과를 저장할 JSON 파일 경로 (미지정 시 output/ 디렉토리에 자동 생성)",
        default=None,
    )
    parser.add_argument(
        "--no-headless",
        action="store_true",
        help="브라우저 창을 화면에 표시합니다 (디버깅 시 사용)",
    )
    return parser.parse_args()


def save_json(data: dict, output_path: Path | None) -> Path:
    """결과를 JSON 파일로 저장하고 경로를 반환합니다."""
    if output_path is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        platform = data.get("platform", "unknown")
        output_path = OUTPUT_DIR / f"{platform}_{timestamp}.json"

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return output_path


async def _run(url: str) -> dict:
    """브라우저를 생성하고 스크래핑을 실행합니다."""
    async with create_browser() as browser:
        return await run_scraping(url, browser)


def main() -> None:
    args = parse_args()

    if args.no_headless:
        import os
        os.environ["HEADLESS"] = "false"
        import importlib
        import config
        importlib.reload(config)
        import utils.browser
        importlib.reload(utils.browser)

    logger.info("=" * 60)
    logger.info("스크래핑 시작: %s", args.url)
    logger.info("=" * 60)

    try:
        result = asyncio.run(_run(args.url))
    except KeyboardInterrupt:
        logger.info("사용자 중단")
        sys.exit(0)
    except Exception as e:
        logger.error("예외 발생: %s", e, exc_info=True)
        sys.exit(1)

    print("\n" + "=" * 60)
    print("[ 수집 결과 ]")
    print("=" * 60)
    print(json.dumps(result, ensure_ascii=False, indent=2))

    saved_path = save_json(result, args.output)
    print(f"\n저장 완료: {saved_path}")


if __name__ == "__main__":
    main()
