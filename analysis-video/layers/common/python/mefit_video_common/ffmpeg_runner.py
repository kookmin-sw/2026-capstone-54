import subprocess
from mefit_video_common.config import FFMPEG_PATH
from mefit_video_common.logger import get_logger

log = get_logger(__name__)


def run_ffmpeg(args: list[str], description: str = "") -> subprocess.CompletedProcess:
    cmd = [FFMPEG_PATH, "-y", "-hide_banner", "-loglevel", "error"] + args
    log.info("ffmpeg_start", description=description, cmd=" ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=280)
    if result.returncode != 0:
        log.error(
            "ffmpeg_failed", stderr=result.stderr[:500], returncode=result.returncode
        )
        raise RuntimeError(f"ffmpeg failed: {result.stderr[:200]}")
    log.info("ffmpeg_done", description=description)
    return result
