from django.urls import path

from .views import docs_schema, docs_ui

app_name = "realtime_docs"

urlpatterns = [
  path("", docs_ui, name="ui"),
  path("schema/", docs_schema, name="schema"),
]
