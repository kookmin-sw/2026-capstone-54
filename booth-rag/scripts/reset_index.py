#!/usr/bin/env python3
"""CLI: drop the vector + graph index.

Run this before changing EMBEDDING_LOCAL_MODEL — the index must be rebuilt
from scratch so that all stored vectors come from the same embedding model.

Usage:
    uv run python scripts/reset_index.py [--yes]
"""

from __future__ import annotations

import argparse
import logging
import sys

from booth_rag.rag.service import get_rag_service


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset the booth-rag index.")
    parser.add_argument("--yes", "-y", action="store_true", help="Skip the confirmation prompt")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    rag = get_rag_service()
    info = rag.embedding_info
    print("⚠️  벡터 + 그래프 인덱스를 모두 삭제합니다 (대화 히스토리는 유지).")
    print(f"   현재 임베딩: {info['model']} ({info['device']}, {info['dimension']}-d)")
    print(f"   인덱스 상태: {rag.stats()}")

    if not args.yes:
        try:
            confirm = input("\n계속하려면 'reset' 을 입력하세요: ").strip()
        except EOFError:
            print("(stdin 닫힘, 취소)")
            return 1
        if confirm != "reset":
            print("취소되었습니다.")
            return 1

    rag.reset_index()
    print("\n✅ 인덱스 초기화 완료. 새 모델로 재적재하려면:")
    print("   uv run python scripts/ingest_codebase.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
