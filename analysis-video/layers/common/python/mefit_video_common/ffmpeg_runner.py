import os
import subprocess
from mefit_video_common.config import FFMPEG_PATH
from mefit_video_common.logger import get_logger

log = get_logger(__name__)

# Lambda 제한 시간에서 cleanup 여유분(30초)을 뺀 값을 기본 timeout으로 사용
DEFAULT_TIMEOUT = int(os.environ.get("FFMPEG_TIMEOUT", "550"))


def run_ffmpeg(
    args: list[str], description: str = "", timeout: int | None = None
) -> subprocess.CompletedProcess:
    effective_timeout = timeout or DEFAULT_TIMEOUT
    cmd = [FFMPEG_PATH, "-y", "-hide_banner", "-loglevel", "error"] + args
    log.info(
        "ffmpeg_start",
        description=description,
        timeout=effective_timeout,
        cmd=" ".join(cmd),
    )
    result = subprocess.run(
        cmd, capture_output=True, text=True, timeout=effective_timeout
    )
    if result.returncode != 0:
        log.error(
            "ffmpeg_failed", stderr=result.stderr[:500], returncode=result.returncode
        )
        raise RuntimeError(f"ffmpeg failed: {result.stderr[:200]}")
    log.info("ffmpeg_done", description=description)
    return result
