from django.urls import include, path

urlpatterns = [
  path("demo/", include("api.v1.demo.urls")),
  path("health-check/", include("api.v1.health_check.urls")),
  path("users/", include("api.v1.users.urls")),
  path("realtime/", include("api.v1.realtime.urls")),
  path("interviews/", include("api.v1.interviews.urls")),
  path("terms-documents/", include("api.v1.terms_documents.urls")),
  path("streaks/", include("api.v1.streaks.urls")),
  path("resumes/", include("api.v1.resumes.urls")),
  path("job-descriptions/", include("api.v1.job_descriptions.urls")),
  path("user-job-descriptions/", include("api.v1.user_job_descriptions.urls")),
  path("tickets/", include("api.v1.tickets.urls")),
  path("", include("api.v1.profiles.urls")),
]
