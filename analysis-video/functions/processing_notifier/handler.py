import json
import boto3
from mefit_video_common.config import (
    SNS_TOPIC_ARN,
    REGION,
    SCALED_VIDEO_BUCKET,
    AUDIO_BUCKET,
)
from mefit_video_common.event_parser import parse_s3_records


def handler(event, context):
    for _bucket, key in parse_s3_records(event):
        parts = key.split("/")
        if len(parts) < 2:
            continue
        session_uuid = parts[0]
        turn_id = parts[1]
        base_key = f"{session_uuid}/{turn_id}"

        s3 = boto3.client("s3", region_name=REGION)
        all_ready = True

        for check_bucket, suffix in [
            (SCALED_VIDEO_BUCKET, ".mp4"),
            (AUDIO_BUCKET, ".wav"),
        ]:
            response = s3.list_objects_v2(
                Bucket=check_bucket, Prefix=base_key, MaxKeys=1
            )
            if response.get("KeyCount", 0) == 0:
                all_ready = False
                break

        if all_ready and SNS_TOPIC_ARN:
            sns = boto3.client("sns", region_name=REGION)
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=json.dumps(
                    {
                        "type": "video_processing_complete",
                        "sessionUuid": session_uuid,
                        "turnId": turn_id,
                    }
                ),
                Subject="MeFit Video Processing Complete",
            )
