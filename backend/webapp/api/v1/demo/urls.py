from api.v1.demo.views.scrape_demo_api_view import ScrapeDemoAPIView
from django.urls import path

urlpatterns = [
  path("scrape/", ScrapeDemoAPIView.as_view()),
]
