"""
Django Internationalization Settings
- https://docs.djangoproject.com/en/5.1/topics/i18n/
"""

LANGUAGE_CODE = 'ko-kr'

TIME_ZONE = 'Asia/Seoul'

USE_I18N = True

USE_TZ = True

__all__ = [
  "LANGUAGE_CODE",
  "TIME_ZONE",
  "USE_I18N",
  "USE_TZ",
]
