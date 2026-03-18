#!/bin/bash

APP_NAME=$1
TARGET_OR_STEP=$2
STEP_MODE=false
STEP_VALUE=

if [ -z "$APP_NAME" ]; then
  # 앱 이름이 비어있으면 전체 대상 마이그레이션 수행
  docker-compose exec webapp python manage.py migrate
  exit 0
fi

if [ "$TARGET_OR_STEP" == "--step" ]; then
  STEP_MODE=true
  STEP_VALUE=$3
  if [ -z "$STEP_VALUE" ] || ! [[ "$STEP_VALUE" =~ ^-?[0-9]+$ ]]; then
    echo "Usage: $0 <app_name> --step <N>"
    exit 1
  fi
elif [ -z "$TARGET_OR_STEP" ]; then
  # 기본 동작: migrate 해당 앱
  docker-compose exec webapp python manage.py migrate "$APP_NAME"
  exit 0
fi

if [ "$STEP_MODE" = true ]; then
  STEP=$STEP_VALUE
  # 현재 마이그레이션 목록을 가져옴 (최신순)
  MIGRATIONS=($(docker-compose exec webapp python manage.py showmigrations "$APP_NAME" | grep '\[X\]' | awk '{print $2}'))

  CURRENT_INDEX=$((${#MIGRATIONS[@]} - 1))
  TARGET_INDEX=$((CURRENT_INDEX - STEP))

  if [ $TARGET_INDEX -lt -1 ]; then
    TARGET_INDEX=-1
  fi

  if [ $TARGET_INDEX -eq -1 ]; then
    TARGET="zero"
  else
    TARGET=${MIGRATIONS[$TARGET_INDEX]}
  fi
else
  # 직접 타겟 지정
  TARGET=$TARGET_OR_STEP
fi

echo "Migrate $APP_NAME to $TARGET"
docker-compose exec webapp python manage.py migrate "$APP_NAME" "$TARGET"
