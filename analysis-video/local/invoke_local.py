"""analysis-video Lambda 핸들러 로컬 테스트 스크립트.

Usage:
    python local/invoke_local.py video_converter <bucket> <key>
    python local/invoke_local.py frame_extractor <bucket> <key>
    python local/invoke_local.py audio_extractor <bucket> <key>
    python local/invoke_local.py audio_scaler <bucket> <key>
"""

import importlib
import json
import os
import sys

FUNCTIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "functions")
LAYERS_DIR = os.path.join(os.path.dirname(__file__), "..", "layers", "common", "python")

sys.path.insert(0, LAYERS_DIR)


def make_s3_event(bucket: str, key: str) -> dict:
    return {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": bucket},
                    "object": {"key": key},
                }
            }
        ]
    }


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)

    func_name = sys.argv[1]
    bucket = sys.argv[2]
    key = sys.argv[3]

    os.environ.setdefault("REGION", "us-east-1")
    os.environ.setdefault("FFMPEG_PATH", "ffmpeg")

    func_dir = os.path.join(FUNCTIONS_DIR, func_name)
    if not os.path.isdir(func_dir):
        print(f"Function not found: {func_name}")
        sys.exit(1)

    sys.path.insert(0, func_dir)
    handler_module = importlib.import_module("handler")

    event = make_s3_event(bucket, key)
    print(f"Invoking {func_name} with event:")
    print(json.dumps(event, indent=2))

    result = handler_module.handler(event, None)
    print(f"\nResult: {json.dumps(result, indent=2, default=str)}")


if __name__ == "__main__":
    main()
