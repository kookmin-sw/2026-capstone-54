from __future__ import annotations

from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_M


def generate_qr(data: str, output_path: Path, box_size: int = 10, border: int = 2) -> Path:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=box_size,
        border=border,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0A0A0A", back_color="#FFFFFF")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(output_path))
    return output_path


def ensure_booth_qrs(out_dir: Path, mefit_url: str, team_page_url: str) -> dict[str, Path]:
    targets = {
        "mefit": (mefit_url, out_dir / "qr-mefit.png"),
        "team": (team_page_url, out_dir / "qr-team.png"),
    }
    paths: dict[str, Path] = {}
    for name, (url, path) in targets.items():
        if not path.exists():
            generate_qr(url, path)
        paths[name] = path
    return paths
