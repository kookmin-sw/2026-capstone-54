#!/bin/bash

APP_NAME=${1:-}

if [ -z "$APP_NAME" ]; then
  docker-compose exec webapp python manage.py makemigrations
else
  docker-compose exec webapp python manage.py makemigrations "$APP_NAME"
fi
