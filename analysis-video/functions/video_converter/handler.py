import os
from mefit_video_common.config import SCALED_VIDEO_BUCKET
from mefit_video_common.event_parser import parse_s3_records
from mefit_video_common.ffmpeg_runner import run_ffmpeg
from mefit_video_common.logger import get_logger
from mefit_video_common.s3_client import download_to_tmp, upload_from_tmp
from mefit_video_common.celery_publisher import publish_step_complete

log = get_logger(__name__)

# S3 업로드 + cleanup에 필요한 여유 시간 (초)
_BUFFER_SECONDS = 30


def handler(event, context):
    for bucket, key in parse_s3_records(event):
        try:
            _process(bucket, key, context)
        except RuntimeError as e:
            log.error("skipped_corrupt_file", key=key, error=str(e)[:200])
            continue


def _get_ffmpeg_timeout(context) -> int:
    """Lambda 잔여 시간에서 버퍼를 뺀 값을 ffmpeg timeout으로 사용"""
    remaining_ms = context.get_remaining_time_in_millis()
    return max(remaining_ms // 1000 - _BUFFER_SECONDS, 60)


def _process(bucket, key, context):
    input_path = download_to_tmp(bucket, key)
    output_path = input_path.rsplit(".", 1)[0] + ".mp4"

    ffmpeg_timeout = _get_ffmpeg_timeout(context)
    log.info("ffmpeg_timeout_calculated", timeout=ffmpeg_timeout, key=key)

    run_ffmpeg(
        [
            "-i",
            input_path,
            "-vf",
            "scale='min(1280,iw)':'-2'",
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "28",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            output_path,
        ],
        description=f"convert {key}",
        timeout=ffmpeg_timeout,
    )

    output_key = key.rsplit(".", 1)[0] + ".mp4"
    upload_from_tmp(output_path, SCALED_VIDEO_BUCKET, output_key, "video/mp4")

    parts = key.split("/")
    if len(parts) >= 2:
        publish_step_complete(
            session_uuid=parts[0],
            turn_id=parts[1],
            step="video_converter",
            output_bucket=SCALED_VIDEO_BUCKET,
            output_key=output_key,
            source_key=key,
        )

    os.remove(input_path)
    os.remove(output_path)
