import os

VIDEO_BUCKET = os.environ.get("VIDEO_BUCKET", "pj-kmucd1-04-mefit-video-files")
SCALED_VIDEO_BUCKET = os.environ.get(
    "SCALED_VIDEO_BUCKET", "pj-kmucd1-04-mefit-scaled-video-files"
)
FRAME_BUCKET = os.environ.get("FRAME_BUCKET", "pj-kmucd1-04-mefit-video-frame-files")
AUDIO_BUCKET = os.environ.get("AUDIO_BUCKET", "pj-kmucd1-04-mefit-audio-files")
SCALED_AUDIO_BUCKET = os.environ.get(
    "SCALED_AUDIO_BUCKET", "pj-kmucd1-04-mefit-scaled-audio-files"
)
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "")
STEP_COMPLETE_SQS_URL = os.environ.get("STEP_COMPLETE_SQS_URL", "")
REGION = os.environ.get("REGION", "us-east-1")
FFMPEG_PATH = os.environ.get("FFMPEG_PATH", "/opt/bin/ffmpeg")
S3_ENDPOINT_URL = (
    os.environ.get("S3_ENDPOINT_URL", "")
    or os.environ.get("AWS_ENDPOINT_URL", "")
    or None
)
SQS_ENDPOINT_URL = S3_ENDPOINT_URL
