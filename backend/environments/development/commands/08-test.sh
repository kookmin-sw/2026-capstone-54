#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

dc exec -e DJANGO_SETTINGS_MODULE=config.settings.test webapp python manage.py test "$@"
