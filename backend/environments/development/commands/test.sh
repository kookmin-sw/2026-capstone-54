#!/bin/bash

docker-compose exec -e DJANGO_SETTINGS_MODULE=config.settings.test webapp python manage.py test "$@"
