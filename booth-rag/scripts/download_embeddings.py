#!/usr/bin/env python3
"""Pre-download the local embedding model so the server boot stays fast.

The model is fetched into the HuggingFace cache (~/.cache/huggingface/hub/).
Subsequent runs of the server or ingestion CLI load straight from the cache —
no network needed.

Two-phase approach:

  1. huggingface_hub.snapshot_download — pull only the files sentence-transformers
     actually needs (config, tokenizer, weights, pooling).  Skips bulky extras
     like ONNX variants and demo images.  Supports resume, so a stale
     `*.incomplete` blob from a previous interrupted run is finished here.

  2. Warm-up load with HF_HUB_OFFLINE=1 — proves the cache is self-sufficient,
     and reports the embedding dimension.

Usage:
    uv run python scripts/download_embeddings.py
    uv run python scripts/download_embeddings.py --model intfloat/multilingual-e5-small
    uv run python scripts/download_embeddings.py --force-redownload
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from pathlib import Path

from booth_rag.config import get_settings

HF_CACHE = Path.home() / ".cache" / "huggingface" / "hub"

ALLOW_PATTERNS: tuple[str, ...] = (
    "config.json",
    "config_sentence_transformers.json",
    "modules.json",
    "sentence_bert_config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "tokenizer.model",
    "special_tokens_map.json",
    "added_tokens.json",
    "vocab.json",
    "merges.txt",
    "spm.model",
    "sentencepiece.bpe.model",
    "*.safetensors",
    "*.bin",
    "1_Pooling/*",
    "2_Normalize/*",
    "README.md",
)

IGNORE_PATTERNS: tuple[str, ...] = (
    "onnx/*",
    "*.onnx",
    "*.onnx_data",
    "tf_model.h5",
    "flax_model.msgpack",
    "rust_model.ot",
    "openvino/*",
    "imgs/*",
    "*.jpg",
    "*.png",
    "*.webp",
    "*.gif",
    "colbert_linear.pt",
    "sparse_linear.pt",
)


def _clean_incomplete(model_id: str) -> int:
    slug = "models--" + model_id.replace("/", "--")
    blobs_dir = HF_CACHE / slug / "blobs"
    if not blobs_dir.exists():
        return 0
    count = 0
    for f in blobs_dir.glob("*.incomplete"):
        try:
            f.unlink()
            count += 1
        except OSError:
            pass
    return count


def _cache_hit_for(model_id: str) -> bool:
    if not HF_CACHE.exists():
        return False
    slug = "models--" + model_id.replace("/", "--")
    base = HF_CACHE / slug
    if not base.exists():
        return False
    snaps = base / "snapshots"
    if not snaps.exists():
        return False
    for snap in snaps.iterdir():
        if any(snap.glob("config.json")) and (any(snap.glob("*.safetensors")) or any(snap.glob("*.bin"))):
            return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Pre-download the local HuggingFace embedding model.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Tip: run this once after `uv sync` so the server boot stays fast.\n"
            "If you later change EMBEDDING_LOCAL_MODEL in .env, run this again.\n"
        ),
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Override EMBEDDING_LOCAL_MODEL (e.g. intfloat/multilingual-e5-small)",
    )
    parser.add_argument(
        "--device",
        type=str,
        default="cpu",
        choices=["cpu", "mps", "cuda"],
        help="Device for the offline warm-up load (default: cpu)",
    )
    parser.add_argument(
        "--force-redownload",
        action="store_true",
        help="Re-download every file even if already cached",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show INFO logs (HuggingFace + transformers)",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    settings = get_settings()
    model_id = args.model or settings.embedding_local_model

    if settings.embedding_backend.lower() == "remote":
        print(
            "ℹ️ 현재 EMBEDDING_BACKEND=remote 이지만, 사전 다운로드는 항상 이 머신에 받습니다.\n"
            "   원격 서버 머신에서도 동일 모델을 받아두려면 그쪽에서 별도로 실행하세요.\n"
        )

    print("📥 임베딩 모델 사전 다운로드")
    print(f"   ├─ 모델:       {model_id}")
    print(f"   ├─ 캐시 경로:  {HF_CACHE}")
    print(f"   └─ 디바이스:   {args.device}  (워밍업용)")
    print()

    cleaned = _clean_incomplete(model_id)
    if cleaned:
        print(f"🧹 미완성 다운로드 잔재 {cleaned}개 정리")

    cached = _cache_hit_for(model_id)
    if cached and not args.force_redownload:
        print("✓ 캐시 적중 (snapshot_download 가 누락 파일만 보강합니다)")
    elif cached and args.force_redownload:
        print("ℹ️ --force-redownload: 모든 파일을 다시 받습니다.")

    try:
        from huggingface_hub import snapshot_download
        from huggingface_hub.errors import LocalEntryNotFoundError
    except ImportError:
        print(
            "\n❌ huggingface_hub 가 설치되지 않았습니다. uv sync 를 먼저 실행하세요.",
            file=sys.stderr,
        )
        return 1

    started = time.time()
    snapshot_path: str | Path | None = None
    skipped_network = False

    if not args.force_redownload:
        try:
            snapshot_path = snapshot_download(
                repo_id=model_id,
                allow_patterns=list(ALLOW_PATTERNS),
                ignore_patterns=list(IGNORE_PATTERNS),
                local_files_only=True,
            )
            skipped_network = True
        except LocalEntryNotFoundError:
            snapshot_path = None
        except Exception:
            snapshot_path = None

    if snapshot_path is None:
        print("⬇️  네트워크에서 누락 파일을 가져옵니다 (allow_patterns 로 제한)...")
        try:
            snapshot_path = snapshot_download(
                repo_id=model_id,
                allow_patterns=list(ALLOW_PATTERNS),
                ignore_patterns=list(IGNORE_PATTERNS),
                force_download=args.force_redownload,
            )
        except Exception as exc:
            print(
                f"\n❌ snapshot_download 실패: {exc}\n   네트워크가 막혀 있거나 모델 ID 가 잘못된 경우입니다.",
                file=sys.stderr,
            )
            return 1
    download_elapsed = time.time() - started

    label = "캐시에서 즉시 확보" if skipped_network else "snapshot 다운로드 완료"
    print(f"\n📦 {label} ({download_elapsed:.1f}s)")
    print(f"   경로: {snapshot_path}")

    print("\n🔬 오프라인 워밍업 (HF_HUB_OFFLINE=1) — 캐시가 자급 가능한지 검증")
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"

    warmup_started = time.time()
    try:
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer(model_id, device=args.device)
    except Exception as exc:
        print(
            f"\n❌ 오프라인 로드 실패: {exc}\n   캐시가 자급 불가능합니다. 네트워크 환경에서 다시 받으세요.",
            file=sys.stderr,
        )
        return 1

    try:
        if hasattr(model, "get_embedding_dimension"):
            dim = model.get_embedding_dimension()
        else:
            dim = model.get_sentence_embedding_dimension()
    except Exception:
        dim = "?"

    warmup_elapsed = time.time() - warmup_started

    print()
    print(f"✅ 준비 완료 (다운로드 {download_elapsed:.1f}s + 워밍업 {warmup_elapsed:.1f}s)")
    print(f"   ├─ 모델 ID:    {model_id}")
    print(f"   ├─ 임베딩 차원: {dim}")
    print(f"   └─ 캐시 경로:   {HF_CACHE}")
    print()
    print("이제 서버는 네트워크 없이도 즉시 부팅됩니다:")
    print("   uv run uvicorn booth_rag.main:app --host 127.0.0.1 --port 8765")
    return 0


if __name__ == "__main__":
    sys.exit(main())
