import os
from mefit_video_common.config import SCALED_VIDEO_BUCKET
from mefit_video_common.s3_client import download_to_tmp, upload_from_tmp
from mefit_video_common.ffmpeg_runner import run_ffmpeg


def handler(event, context):
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        input_path = download_to_tmp(bucket, key)
        output_path = input_path.rsplit(".", 1)[0] + ".mp4"

        run_ffmpeg(
            [
                "-i",
                input_path,
                "-vf",
                "scale='min(1280,iw)':'-2'",  # max 720p width, preserve aspect
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

        # cleanup /tmp
        os.remove(input_path)
        os.remove(output_path)
