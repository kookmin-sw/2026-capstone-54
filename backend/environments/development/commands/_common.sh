#!/bin/bash

# 공통 설정 및 함수
# 모든 command 스크립트에서 source로 불러와 사용

export MSYS_NO_PATHCONV=1

if docker compose version >/dev/null 2>&1; then
  dc() { docker compose "$@"; }
else
  dc() { docker-compose "$@"; }
fi

export -f dc
