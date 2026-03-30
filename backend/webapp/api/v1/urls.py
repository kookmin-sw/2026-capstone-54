from django.urls import include, path

urlpatterns = [
  path("health-check/", include("api.v1.health_check.urls")),
  path("users/", include("api.v1.users.urls")),
  path("realtime/", include("api.v1.realtime.urls")),
  path("interview/", include("api.v1.interview.urls")),
]
