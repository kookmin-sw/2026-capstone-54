"""
DRF Settings
"""

from .common import SERVICE_NAME

REST_FRAMEWORK = {
  "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
  "DEFAULT_PERMISSION_CLASSES": (),
  "DEFAULT_RENDERER_CLASSES": (
    "djangorestframework_camel_case.render.CamelCaseJSONRenderer",
    "djangorestframework_camel_case.render.CamelCaseBrowsableAPIRenderer",
    "rest_framework.renderers.JSONRenderer",
  ),
  "DEFAULT_PARSER_CLASSES": (
    "djangorestframework_camel_case.parser.CamelCaseFormParser",
    "djangorestframework_camel_case.parser.CamelCaseMultiPartParser",
    "djangorestframework_camel_case.parser.CamelCaseJSONParser",
  ),
  "DEFAULT_AUTHENTICATION_CLASSES": (
    "rest_framework_simplejwt.authentication.JWTAuthentication",
    "rest_framework.authentication.SessionAuthentication",
  ),
  "JSON_UNDERSCOREIZE": {
    "no_underscore_before_number": True,
  },
  "DEFAULT_FILTER_BACKENDS": (
    "django_filters.rest_framework.DjangoFilterBackend",
    "rest_framework.filters.OrderingFilter",
    "rest_framework.filters.SearchFilter",
  ),
  "DEFAULT_PAGINATION_CLASS": "common.pagination.StandardPagination",
  "EXCEPTION_HANDLER": "common.exceptions.handler.custom_exception_handler",
}

SPECTACULAR_SETTINGS = {
  "TITLE": f"{SERVICE_NAME} API",
  "DESCRIPTION": f"API for {SERVICE_NAME} Web Application",
  "VERSION": "1.0.0",
  "SERVE_INCLUDE_SCHEMA": False,
  "SWAGGER_UI_OAUTH2_REDIRECT_URL": "/docs/oauth2-redirect/",
  "CONTACT": {
    "name": "shinkeonkim",
    "email": "dev.shinkeonkim@gmail.com",
  },
  "CAMELIZE_NAMES": True,
  "POSTPROCESSING_HOOKS": [
    "drf_spectacular.contrib.djangorestframework_camel_case.camelize_serializer_fields",
    "drf_spectacular.hooks.postprocess_schema_enums",
    "common.exceptions.schema.inject_error_responses",
  ],
}

__all__ = [
  "REST_FRAMEWORK",
  "SPECTACULAR_SETTINGS",
]
