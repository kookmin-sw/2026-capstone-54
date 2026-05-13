from django.http import QueryDict
from djangorestframework_camel_case.util import underscoreize


class CamelCaseMiddleware:
  """
  Middleware to convert camelCase query params to snake_case
  for Django Rest Framework
  """

  def __init__(self, get_response):
    self.get_response = get_response

  def __call__(self, request):
    if request.GET:
      underscored_dict = underscoreize(request.GET.dict())
      request.GET = QueryDict(mutable=True)
      request.GET.update(underscored_dict)

    return self.get_response(request)
