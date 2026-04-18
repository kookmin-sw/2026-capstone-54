import os
import glob
from mefit_video_common.config import FRAME_BUCKET
from mefit_video_common.s3_client import download_to_tmp, upload_from_tmp
from mefit_video_common.ffmpeg_runner import run_ffmpeg


def handler(event, context):
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        input_path = download_to_tmp(bucket, key)
        tmp_dir = input_path.rsplit(".", 1)[0] + "_frames"
        os.makedirs(tmp_dir, exist_ok=True)

        run_ffmpeg(
            [
                "-i",
                input_path,
                "-vf",
                "fps=1",
                "-q:v",
                "3",
                f"{tmp_dir}/frame_%05d.jpg",
            ],
            description=f"extract frames {key}",
        )

        original_key_prefix = key.rsplit(".", 1)[0]

        # Upload each frame
        for frame_path in glob.glob(f"{tmp_dir}/frame_*.jpg"):
            frame_filename = os.path.basename(frame_path)
            frame_key = f"{original_key_prefix}/frames/{frame_filename}"
            upload_from_tmp(frame_path, FRAME_BUCKET, frame_key, "image/jpeg")
            os.remove(frame_path)

        os.rmdir(tmp_dir)
        os.remove(input_path)
