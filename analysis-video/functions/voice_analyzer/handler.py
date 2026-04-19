"""voice-analyzer Lambda: 묵음 구간, 발화/묵음 타임라인, dBFS 측정.

Celery worker에서 동기 호출(RequestResponse)로 사용한다.
입력: {"audioKey": "...", "audioBucket": "...", "sessionUuid": "...", "turnId": "..."}
출력: {"summary": {...}, "timeline": [...]}
"""

import json
import os
import tempfile
import warnings

FFMPEG_BIN = os.environ.get(
    "FFMPEG_PATH", os.environ.get("PYDUB_FFMPEG", "/opt/bin/ffmpeg")
)
FFPROBE_BIN = FFMPEG_BIN.replace("ffmpeg", "ffprobe")
os.environ["PYDUB_FFMPEG"] = FFMPEG_BIN
os.environ["PYDUB_FFPROBE"] = FFPROBE_BIN
os.environ["PATH"] = os.environ.get("PATH", "") + ":" + os.path.dirname(FFMPEG_BIN)

warnings.filterwarnings("ignore", category=SyntaxWarning, module=r"pydub")
warnings.filterwarnings("ignore", category=DeprecationWarning, module=r"pydub")
warnings.filterwarnings("ignore", category=RuntimeWarning, module=r"pydub")

import boto3
from pydub import AudioSegment
from pydub.silence import detect_silence

AudioSegment.converter = FFMPEG_BIN
AudioSegment.ffprobe = FFPROBE_BIN

SILENCE_THRESH_DBFS = int(os.environ.get("SILENCE_THRESH_DBFS", "-40"))
MIN_SILENCE_LEN_MS = int(os.environ.get("MIN_SILENCE_LEN_MS", "500"))
SEEK_STEP_MS = int(os.environ.get("SEEK_STEP_MS", "10"))

REGION = os.environ.get("REGION", "us-east-1")
S3_ENDPOINT_URL = (
    os.environ.get("S3_ENDPOINT_URL", "")
    or os.environ.get("AWS_ENDPOINT_URL", "")
    or None
)

s3 = None


def _get_s3():
    global s3
    if s3 is None:
        kwargs = {"region_name": REGION}
        if S3_ENDPOINT_URL:
            kwargs["endpoint_url"] = S3_ENDPOINT_URL
        s3 = boto3.client("s3", **kwargs)
    return s3


def handler(event, context):
    audio_bucket = event["audioBucket"]
    audio_key = event["audioKey"]

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        _get_s3().download_file(audio_bucket, audio_key, tmp.name)
        tmp_path = tmp.name

    try:
        result = _analyze(tmp_path)
        result["sessionUuid"] = event.get("sessionUuid", "")
        result["turnId"] = event.get("turnId", "")
        result["audioKey"] = audio_key

        return {"statusCode": 200, "body": json.dumps(result, ensure_ascii=False)}
    finally:
        os.unlink(tmp_path)


def _analyze(file_path: str) -> dict:
    audio = AudioSegment.from_file(file_path)
    total_ms = len(audio)

    if total_ms == 0:
        return {"summary": _empty_summary(), "timeline": []}

    silence_ranges = detect_silence(
        audio,
        min_silence_len=MIN_SILENCE_LEN_MS,
        silence_thresh=SILENCE_THRESH_DBFS,
        seek_step=SEEK_STEP_MS,
    )

    timeline = _build_timeline(silence_ranges, total_ms, audio)

    silence_ms = sum(end - start for start, end in silence_ranges)
    speech_ms = total_ms - silence_ms
    speech_segs = [t for t in timeline if t["type"] == "speech"]
    avg_dbfs_speech = (
        sum(t["dbfs"] for t in speech_segs) / len(speech_segs) if speech_segs else None
    )

    summary = {
        "totalDurationMs": total_ms,
        "speechDurationMs": speech_ms,
        "silenceDurationMs": silence_ms,
        "silenceRatio": round(silence_ms / total_ms, 4),
        "speechRatio": round(speech_ms / total_ms, 4),
        "avgDbfsOverall": round(audio.dBFS, 2),
        "avgDbfsSpeech": round(avg_dbfs_speech, 2)
        if avg_dbfs_speech is not None
        else None,
        "silenceSegmentCount": len(silence_ranges),
        "speechSegmentCount": len(speech_segs),
    }

    return {"summary": summary, "timeline": timeline}


def _build_timeline(silence_ranges, total_ms, audio):
    events = []
    cursor = 0

    for s_start, s_end in silence_ranges:
        if cursor < s_start:
            seg = audio[cursor:s_start]
            seg_dbfs = round(seg.dBFS, 2) if len(seg) > 0 else None
            events.append(
                {
                    "startMs": cursor,
                    "endMs": s_start,
                    "type": "speech",
                    "dbfs": seg_dbfs,
                }
            )
        events.append(
            {"startMs": s_start, "endMs": s_end, "type": "silence", "dbfs": None}
        )
        cursor = s_end

    if cursor < total_ms:
        seg = audio[cursor:total_ms]
        seg_dbfs = round(seg.dBFS, 2) if len(seg) > 0 else None
        events.append(
            {"startMs": cursor, "endMs": total_ms, "type": "speech", "dbfs": seg_dbfs}
        )

    return events


def _empty_summary():
    return {
        "totalDurationMs": 0,
        "speechDurationMs": 0,
        "silenceDurationMs": 0,
        "silenceRatio": 0.0,
        "speechRatio": 0.0,
        "avgDbfsOverall": None,
        "avgDbfsSpeech": None,
        "silenceSegmentCount": 0,
        "speechSegmentCount": 0,
    }
