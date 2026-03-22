"""
Django Admin Settings
"""

from .common import SERVICE_NAME

UNFOLD = {
  "SITE_TITLE": f"{SERVICE_NAME} Admin",
  "SITE_HEADER": f"{SERVICE_NAME} Admin",
  "SITE_BRANDING": f"{SERVICE_NAME} Admin",
  "SHOW_HISTORY": True,
  "SHOW_VIEW_ON_SITE": True,
  "SHOW_BACK_BUTTON": False,
}

__all__ = [
  "UNFOLD",
]
