import glob
import json
import os

import boto3

from mefit_video_common.config import FRAME_BUCKET
from mefit_video_common.event_parser import parse_s3_records
from mefit_video_common.ffmpeg_runner import run_ffmpeg
from mefit_video_common.logger import get_logger
from mefit_video_common.s3_client import download_to_tmp, upload_from_tmp
from mefit_video_common.celery_publisher import publish_step_complete

log = get_logger(__name__)


def _publish_face_trigger(
    session_uuid: str,
    turn_id: str,
    frame_bucket: str,
    frame_prefix: str,
    source_key: str,
) -> None:
    """Face_Trigger_SQS에 face_analyzer 트리거 메시지를 발행한다."""
    face_trigger_sqs_url = os.environ.get("FACE_TRIGGER_SQS_URL", "")
    if not face_trigger_sqs_url:
        log.info("face_trigger_skip", reason="FACE_TRIGGER_SQS_URL not set")
        return

    message = {
        "frameBucket": frame_bucket,
        "framePrefix": frame_prefix,
        "sessionUuid": session_uuid,
        "turnId": turn_id,
        "sourceKey": source_key,
    }

    try:
        sqs = boto3.client("sqs", region_name=os.environ.get("REGION", "us-east-1"))
        sqs.send_message(
            QueueUrl=face_trigger_sqs_url,
            MessageBody=json.dumps(message),
        )
        log.info("face_trigger_published", session_uuid=session_uuid, turn_id=turn_id)
    except Exception:
        log.exception(
            "face_trigger_publish_failed",
            session_uuid=session_uuid,
            turn_id=turn_id,
        )


def handler(event, context):
    for bucket, key in parse_s3_records(event):
        try:
            _process(bucket, key)
        except RuntimeError as e:
            log.error("skipped_corrupt_file", key=key, error=str(e)[:200])
            continue


def _process(bucket, key):
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
    frame_prefix = f"{original_key_prefix}/frames/"

    for frame_path in glob.glob(f"{tmp_dir}/frame_*.jpg"):
        frame_filename = os.path.basename(frame_path)
        frame_key = f"{frame_prefix}{frame_filename}"
        upload_from_tmp(frame_path, FRAME_BUCKET, frame_key, "image/jpeg")
        os.remove(frame_path)

    parts = key.split("/")
    if len(parts) >= 2:
        publish_step_complete(
            session_uuid=parts[0],
            turn_id=parts[1],
            step="frame_extractor",
            output_bucket=FRAME_BUCKET,
            output_key=frame_prefix,
            source_key=key,
        )

        _publish_face_trigger(
            session_uuid=parts[0],
            turn_id=parts[1],
            frame_bucket=FRAME_BUCKET,
            frame_prefix=frame_prefix,
            source_key=key,
        )

    os.rmdir(tmp_dir)
    os.remove(input_path)
