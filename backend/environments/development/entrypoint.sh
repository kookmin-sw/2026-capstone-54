#!/bin/sh

echo "Waiting for postgres..."

while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
  sleep 0.1
done

echo "PostgreSQL started"

uv run python manage.py collectstatic --noinput
uv run python manage.py migrate --noinput
exec "$@"
