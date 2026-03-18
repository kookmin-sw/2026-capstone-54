#!/bin/bash

set -euo pipefail

docker-compose exec webapp python manage.py createsuperuser "$@"
