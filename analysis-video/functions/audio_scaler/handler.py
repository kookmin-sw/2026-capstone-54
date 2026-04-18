import os
from mefit_video_common.config import SCALED_AUDIO_BUCKET
from mefit_video_common.s3_client import download_to_tmp, upload_from_tmp
from mefit_video_common.ffmpeg_runner import run_ffmpeg


def handler(event, context):
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        input_path = download_to_tmp(bucket, key)
        output_path = input_path.rsplit(".", 1)[0] + "_scaled.wav"

        run_ffmpeg(
            ["-i", input_path, "-ar", "16000", "-ac", "1", output_path],
            description=f"scale audio {key}",
        )

        upload_from_tmp(output_path, SCALED_AUDIO_BUCKET, key, "audio/wav")

        os.remove(input_path)
        os.remove(output_path)
