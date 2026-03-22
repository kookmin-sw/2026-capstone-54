"""
Django Static/Media Files Settings
"""

from .common import BASE_DIR

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files (User uploaded files)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

__all__ = [
  "STATIC_URL",
  "STATIC_ROOT",
  "MEDIA_URL",
  "MEDIA_ROOT",
]
