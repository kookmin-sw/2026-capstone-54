#!/bin/bash
set -e

FUNC_NAME=$1
FUNCTIONS_DIR="/opt/mefit/functions"
LAYERS_DIR="/opt/mefit/layers/common/python"
OUT_DIR="/tmp/lambda-packages"

mkdir -p "$OUT_DIR"

TMPDIR=$(mktemp -d)
cp "$FUNCTIONS_DIR/$FUNC_NAME/handler.py" "$TMPDIR/"
cp -r "$LAYERS_DIR/mefit_video_common" "$TMPDIR/"
(cd "$TMPDIR" && zip -qr "$OUT_DIR/$FUNC_NAME.zip" .)
rm -rf "$TMPDIR"

echo "$OUT_DIR/$FUNC_NAME.zip"
