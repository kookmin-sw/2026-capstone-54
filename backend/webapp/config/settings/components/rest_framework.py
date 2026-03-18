"""
DRF Settings
"""

from .common import SERVICE_NAME

REST_FRAMEWORK = {
  "DEFAULT_SCHEMA_CLASS":
  "drf_spectacular.openapi.AutoSchema",
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
    "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
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
  "DEFAULT_PAGINATION_CLASS":
  "common.pagination.StandardPagination",
}
