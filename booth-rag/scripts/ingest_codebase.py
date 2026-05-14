#!/usr/bin/env python3
"""CLI: ingest the MeFit monorepo into the vector + graph index.

Usage:
    uv run python scripts/ingest_codebase.py [--max-files N] [--dirs A,B,C]
"""

from __future__ import annotations

import argparse
import logging
import sys
import time

from tqdm import tqdm

from booth_rag.config import get_settings
from booth_rag.rag.service import IngestionProgress, get_rag_service


def main() -> int:
    parser = argparse.ArgumentParser(description="Ingest source code into RAG index.")
    parser.add_argument("--max-files", type=int, default=None, help="Limit total files (smoke test)")
    parser.add_argument(
        "--dirs",
        type=str,
        default=None,
        help="Override INGEST_INCLUDE_DIRS (comma-separated)",
    )
    parser.add_argument("--verbose", "-v", action="store_true", help="Show DEBUG logs")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    settings = get_settings()
    include_dirs = (
        tuple(p.strip() for p in args.dirs.split(",") if p.strip()) if args.dirs else settings.ingest_include_dirs
    )

    rag = get_rag_service()
    info = rag.embedding_info
    print(
        f"📦 적재 시작\n"
        f"   ├─ 소스: {settings.source_repo_path}\n"
        f"   ├─ 대상 디렉토리 ({len(include_dirs)}): {', '.join(include_dirs)}\n"
        f"   ├─ 임베딩: {info['model']} ({info['device']}, {info['dimension']}-d)\n"
        f"   └─ 최대 파일 수: {args.max_files or '제한 없음'}",
        flush=True,
    )

    started = time.time()
    pbar: tqdm | None = None
    last_phase: str | None = None

    def on_progress(p: IngestionProgress) -> None:
        nonlocal pbar, last_phase
        if p.phase == "files":
            if pbar is None or last_phase != "files":
                if pbar is not None:
                    pbar.close()
                pbar = tqdm(total=p.total, desc="files", unit="file", leave=True)
                last_phase = "files"
            pbar.update(1)
            if p.current % 25 == 0 or p.current == p.total:
                pbar.set_postfix_str(p.message[-50:], refresh=False)
        elif p.phase in {"graph", "structure"}:
            if pbar is not None:
                pbar.close()
                pbar = None
            print(f"   • {p.phase}: {p.message}", flush=True)
            last_phase = p.phase
        elif p.phase == "done":
            if pbar is not None:
                pbar.close()
                pbar = None
            last_phase = p.phase

    stats = rag.ingest_codebase(
        max_files=args.max_files,
        include_top_dirs=include_dirs,
        progress_callback=on_progress,
    )
    elapsed = time.time() - started

    print(
        f"\n✅ 완료 ({elapsed:.1f}s)\n"
        f"   ├─ 파일:                 {stats.files_indexed}\n"
        f"   ├─ 청크 총합:            {stats.chunks_indexed}\n"
        f"   ├─ outline 청크:         {stats.outline_chunks}\n"
        f"   ├─ directory_summary:    {stats.directory_summary_chunks}\n"
        f"   └─ 그래프 노드 추가:     {stats.graph_nodes_added}",
        flush=True,
    )
    print("\n📊 인덱스 상태:", rag.stats(), flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
