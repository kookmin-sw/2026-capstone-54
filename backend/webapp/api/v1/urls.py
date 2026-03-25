from django.urls import include, path

urlpatterns = [
  path("health-check/", include("api.v1.health_check.urls")),
  path("users/", include("api.v1.users.urls")),
]
