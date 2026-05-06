#!/usr/bin/env bash
# face-analysis Lambda Layer 빌드 스크립트
#
# 실제 Lambda 런타임에 필요한 패키지만 설치한다:
#   - mediapipe: Face Landmarker (--no-deps로 설치하여 jax/scipy/opencv-contrib 방지)
#   - opencv-python-headless: cv2.imdecode, cv2.cvtColor 등
#   - numpy: 배열 처리
#   - Pillow: mediapipe Image 객체 생성
#   - protobuf, absl-py, attrs, flatbuffers: mediapipe 내부 필수 의존성
#
# 불필요한 패키지 (설치하지 않음):
#   - boto3: Lambda 런타임에 기본 포함
#   - jax/jaxlib/scipy: Face Landmarker에서 미사용
#   - matplotlib/sounddevice/cffi: Face Landmarker에서 미사용 (stub으로 대체)
#   - opencv-contrib-python: opencv-python-headless와 중복
#   - pytest/hypothesis: 테스트 전용
#
# Windows Git Bash + MacOS 호환

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/dist"
OUTPUT_FILE="$OUTPUT_DIR/mefit-face-analysis-layer.zip"
TEMP_DIR=$(mktemp -d)

PIP_COMMON="--platform manylinux2014_x86_64 --python-version 3.12 --only-binary=:all: --implementation cp"

# cleanup on exit
trap 'rm -rf "$TEMP_DIR"' EXIT

mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR/python"

echo "=== Installing runtime packages (all --no-deps) ==="
pip install \
  mediapipe==0.10.14 \
  opencv-python-headless==4.10.0.84 \
  "numpy>=1.26,<2.0" \
  "protobuf>=4.25.3,<5" \
  absl-py \
  attrs \
  flatbuffers \
  -t "$TEMP_DIR/python/" \
  --no-deps \
  $PIP_COMMON

echo ""
echo "=== Adding stubs for unused mediapipe imports ==="
# mediapipe가 import 시 참조하지만 Face Landmarker 실행에 불필요한 모듈의 stub
cp -r "$PROJECT_ROOT/stubs/matplotlib" "$TEMP_DIR/python/"

echo ""
echo "=== Stripping unnecessary files ==="
python "$SCRIPT_DIR/_strip_mediapipe.py" "$TEMP_DIR/python"

echo ""
echo "=== Creating zip ==="
python "$SCRIPT_DIR/_zipdir.py" "$TEMP_DIR" "$OUTPUT_FILE"
