#!/usr/bin/env bash
# face_analyzer Lambda 코드 패키징 스크립트
# Windows Git Bash + MacOS 호환 (POSIX 표준 명령어만 사용)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/dist"
OUTPUT_FILE="$OUTPUT_DIR/face_analyzer.zip"
TEMP_DIR=$(mktemp -d)

# cleanup on exit
trap 'rm -rf "$TEMP_DIR"' EXIT

# 필수 파일 존재 확인
for required in \
  "$PROJECT_ROOT/functions/face_analyzer/handler.py" \
  "$PROJECT_ROOT/analyzer" \
  "$PROJECT_ROOT/models/face_landmarker.task"; do
  if [ ! -e "$required" ]; then
    echo "ERROR: Required file/directory not found: $required" >&2
    exit 1
  fi
done

mkdir -p "$OUTPUT_DIR"

# handler.py를 루트 레벨에 배치
cp "$PROJECT_ROOT/functions/face_analyzer/handler.py" "$TEMP_DIR/"
cp -r "$PROJECT_ROOT/analyzer" "$TEMP_DIR/"
cp -r "$PROJECT_ROOT/models" "$TEMP_DIR/"

# matplotlib stub (mediapipe import 에러 방지)
if [ -d "$PROJECT_ROOT/stubs/matplotlib" ]; then
  cp -r "$PROJECT_ROOT/stubs/matplotlib" "$TEMP_DIR/"
fi

python "$SCRIPT_DIR/_zipdir.py" "$TEMP_DIR" "$OUTPUT_FILE"
