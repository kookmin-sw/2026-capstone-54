#!/usr/bin/env python3
"""CLI: ingest a directory of admin docs (.md / .docx / .txt).

Usage:
    uv run python scripts/ingest_docs.py path/to/docs
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from booth_rag.rag.service import get_rag_service


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest a folder of admin documents.")
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()

    if not args.directory.exists():
        print(f"❌ directory not found: {args.directory}", file=sys.stderr)
        return 1

    rag = get_rag_service()
    total_files = 0
    total_chunks = 0
    for path in sorted(args.directory.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".md", ".mdx", ".markdown", ".txt", ".rst", ".docx"}:
            continue
        stats = rag.ingest_document_path(path)
        if stats.chunks_indexed:
            total_files += 1
            total_chunks += stats.chunks_indexed
            print(f"✓ {path}: {stats.chunks_indexed} chunks")
    print(f"\nTotal: {total_files} files, {total_chunks} chunks")
    print("Index stats:", rag.stats())
    return 0


if __name__ == "__main__":
    sys.exit(main())
