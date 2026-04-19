import os

from mefit_video_common.config import AUDIO_BUCKET, SCALED_AUDIO_BUCKET
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
        base_path = input_path.rsplit(".", 1)[0]
        raw_path = base_path + ".wav"
        scaled_path = base_path + "_16k.wav"

        run_ffmpeg(
            ["-i", input_path, "-vn", "-acodec", "pcm_s16le", raw_path],
            description=f"extract audio {key}",
        )

        run_ffmpeg(
            ["-i", raw_path, "-ar", "16000", "-ac", "1", scaled_path],
            description=f"scale audio {key}",
        )

        output_key = key.rsplit(".", 1)[0] + ".wav"
        upload_from_tmp(raw_path, AUDIO_BUCKET, output_key, "audio/wav")
        upload_from_tmp(scaled_path, SCALED_AUDIO_BUCKET, output_key, "audio/wav")

        parts = key.split("/")
        if len(parts) >= 2:
            publish_step_complete(
                session_uuid=parts[0],
                turn_id=parts[1],
                step="audio_extractor",
                output_bucket=SCALED_AUDIO_BUCKET,
                output_key=output_key,
            )

        os.remove(input_path)
        os.remove(raw_path)
        os.remove(scaled_path)
