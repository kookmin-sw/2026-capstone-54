#!/usr/bin/env bash
# PlantUML Activity Diagrams -> PNG 변환 스크립트
# Usage: ./generate_png.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== PlantUML Activity Diagrams -> PNG ==="
echo "Directory: $SCRIPT_DIR"
echo ""

count=0
fail=0

for puml in *.puml; do
  [ -f "$puml" ] || continue
  echo -n "  Rendering $puml ... "
  if plantuml -tpng -charset UTF-8 "$puml" 2>&1; then
    echo "OK"
    ((count++))
  else
    echo "FAILED"
    ((fail++))
  fi
done

echo ""
echo "=== Done: ${count} succeeded, ${fail} failed ==="
ls -lh *.png 2>/dev/null || echo "No PNG files generated."
