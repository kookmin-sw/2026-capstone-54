#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

# 테스트 실행 전에 기존 테스트 DB 정리
cleanup_test_db

dc exec webapp bash -c "cd /_lock && uv sync --group test"

dc exec -e DJANGO_SETTINGS_MODULE=config.settings.test webapp python manage.py test "$@"
