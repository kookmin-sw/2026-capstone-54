#!/bin/bash

export MSYS_NO_PATHCONV=1
if docker compose version >/dev/null 2>&1; then
  dc() { docker compose "$@"; }
else
  dc() { docker-compose "$@"; }
fi

dc exec -e DJANGO_SETTINGS_MODULE=config.settings.test webapp python manage.py test "$@"
