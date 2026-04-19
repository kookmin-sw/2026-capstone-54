import os

from mefit_video_common.config import SCALED_AUDIO_BUCKET
from mefit_video_common.event_parser import parse_s3_records
from mefit_video_common.ffmpeg_runner import run_ffmpeg
from mefit_video_common.s3_client import download_to_tmp, upload_from_tmp
from mefit_video_common.celery_publisher import publish_step_complete


def handler(event, context):
    for bucket, key in parse_s3_records(event):
        input_path = download_to_tmp(bucket, key)
        output_path = input_path.rsplit(".", 1)[0] + ".wav"

        run_ffmpeg(
            [
                "-i",
                input_path,
                "-vn",
                "-acodec",
                "pcm_s16le",
                "-ar",
                "16000",
                "-ac",
                "1",
                output_path,
            ],
            description=f"extract+scale audio {key}",
        )

        output_key = key.rsplit(".", 1)[0] + ".wav"
        upload_from_tmp(output_path, SCALED_AUDIO_BUCKET, output_key, "audio/wav")

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
        os.remove(output_path)
