import os
from mefit_video_common.config import SCALED_VIDEO_BUCKET
from mefit_video_common.event_parser import parse_s3_records
from mefit_video_common.ffmpeg_runner import run_ffmpeg
from mefit_video_common.logger import get_logger
from mefit_video_common.s3_client import download_to_tmp, upload_from_tmp
from mefit_video_common.celery_publisher import publish_step_complete

log = get_logger(__name__)


def handler(event, context):
    for bucket, key in parse_s3_records(event):
        try:
            _process(bucket, key)
        except RuntimeError as e:
            log.error("skipped_corrupt_file", key=key, error=str(e)[:200])
            continue


def _process(bucket, key):
    input_path = download_to_tmp(bucket, key)
    output_path = input_path.rsplit(".", 1)[0] + ".mp4"

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
        )

    os.remove(input_path)
    os.remove(output_path)
