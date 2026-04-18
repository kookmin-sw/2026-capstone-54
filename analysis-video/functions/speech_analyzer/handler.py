import os
import json
import boto3
from mefit_video_common.config import SNS_TOPIC_ARN, REGION
from mefit_video_common.s3_client import download_to_tmp
from mefit_video_common.logger import get_logger

logger = get_logger("speech_analyzer")


def handler(event, context):
    logger.info("speech_analyzer invoked", event=event)
    sns = boto3.client("sns", region_name=REGION) if SNS_TOPIC_ARN else None

    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]

        # Parse session_uuid and turn_id from key
        # Pattern: {session-uuid}/{turn-id}/{timestamp}.wav
        parts = key.split("/")
        if len(parts) < 3:
            logger.error("Invalid key format", key=key)
            continue

        session_uuid = parts[0]
        turn_id = parts[1]

        input_path = None
        try:
            input_path = download_to_tmp(bucket, key)
            logger.info("Downloaded audio", input_path=input_path, key=key)

            # STUB: Run speech analysis
            # TODO: Replace with actual speech analysis
            analysis_result = {
                "audioKey": key,
                "metrics": {
                    "speakingRate": 0.0,
                    "averagePitch": 0.0,
                    "pitchVariation": 0.0,
                    "fillerWordCount": 0,
                    "pauseCount": 0,
                    "averagePauseDuration": 0.0,
                    "volumeLevel": 0.0,
                    "volumeVariation": 0.0,
                },
                "confidence": 0.0,
            }

            if sns:
                message = {
                    "type": "speech_analysis_complete",
                    "sessionUuid": session_uuid,
                    "turnId": turn_id,
                    "result": analysis_result,
                }
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Message=json.dumps(message),
                    Subject="Speech Analysis Complete",
                )
                logger.info(
                    "Published analysis to SNS",
                    session_uuid=session_uuid,
                    turn_id=turn_id,
                )

        except Exception as e:
            logger.error(f"Error processing audio: {e}", key=key)
            raise
        finally:
            if input_path and os.path.exists(input_path):
                os.remove(input_path)
