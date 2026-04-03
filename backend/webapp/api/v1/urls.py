from django.urls import include, path

urlpatterns = [
  path("demo/", include("api.v1.demo.urls")),
  path("health-check/", include("api.v1.health_check.urls")),
  path("users/", include("api.v1.users.urls")),
  path("realtime/", include("api.v1.realtime.urls")),
  path("interview/", include("api.v1.interview.urls")),
  path("terms-documents/", include("api.v1.terms_documents.urls")),
  path("streaks/", include("api.v1.streaks.urls")),
  path("", include("api.v1.profiles.urls")),
]
