from django.urls import path

from .views import AchievementClaimAPIView, AchievementListAPIView, AchievementRefreshAPIView

urlpatterns = [
  path("", AchievementListAPIView.as_view(), name="achievement-list"),
  path("refresh/", AchievementRefreshAPIView.as_view(), name="achievement-refresh"),
  path("<str:achievement_code>/claim/", AchievementClaimAPIView.as_view(), name="achievement-claim"),
]
