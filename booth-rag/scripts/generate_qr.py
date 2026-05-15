#!/usr/bin/env python3
"""CLI: regenerate booth QR codes."""

from __future__ import annotations

import sys
from pathlib import Path

from booth_rag.config import get_settings
from booth_rag.utils.qr_generator import ensure_booth_qrs

PACKAGE_IMG = Path(__file__).resolve().parent.parent / "booth_rag" / "ui" / "static" / "img"


def main() -> int:
    settings = get_settings()
    for path in PACKAGE_IMG.glob("qr-*.png"):
        path.unlink()
    paths = ensure_booth_qrs(
        PACKAGE_IMG,
        mefit_url=settings.booth_domain_url,
        team_page_url=settings.booth_team_page_url,
    )
    for name, p in paths.items():
        print(f"✓ {name}: {p}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
