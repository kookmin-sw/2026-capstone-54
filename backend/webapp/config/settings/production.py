from datetime import timedelta

from .base import *  # noqa: F401, F403

SIMPLE_JWT = {
  **SIMPLE_JWT,  # noqa: F405
  "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
}

# ── django-allow-cidr ──
ALLOWED_CIDR_NETS = ["10.42.0.0/16"]

MIDDLEWARE = [
  "allow_cidr.middleware.AllowCIDRMiddleware",
  *MIDDLEWARE,  # noqa: F405
]
