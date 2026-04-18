import os
from mefit_video_common.config import AUDIO_BUCKET
from mefit_video_common.s3_client import download_to_tmp, upload_from_tmp
from mefit_video_common.ffmpeg_runner import run_ffmpeg


def handler(event, context):
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

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
                "44100",
                output_path,
            ],
            description=f"extract audio {key}",
        )

        output_key = key.rsplit(".", 1)[0] + ".wav"
        upload_from_tmp(output_path, AUDIO_BUCKET, output_key, "audio/wav")

        os.remove(input_path)
        os.remove(output_path)
