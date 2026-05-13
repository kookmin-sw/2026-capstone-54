"""
로컬 테스트용 CLI.

사용법:
  python run_local.py ./sample_images
  python run_local.py ./sample_images -o result.json -v
"""

from __future__ import annotations

import argparse
import json
import logging

from analyzer.batch_processor import analyze_local_folder


def main():
    parser = argparse.ArgumentParser(description="얼굴 표정 분석 — 로컬 이미지 폴더")
    parser.add_argument("folder", help="분석할 이미지 폴더 경로")
    parser.add_argument("--output", "-o", default=None, help="결과 JSON 파일 경로")
    parser.add_argument("--pattern", "-p", default="*.jpg", help="이미지 파일 패턴")
    parser.add_argument("--verbose", "-v", action="store_true", help="상세 로그 출력")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    result = analyze_local_folder(folder_path=args.folder, pattern=args.pattern)
    output_json = json.dumps(result, ensure_ascii=False, indent=2)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_json)
        print(f"결과 저장 완료: {args.output}")
    else:
        print(output_json)


if __name__ == "__main__":
    main()
