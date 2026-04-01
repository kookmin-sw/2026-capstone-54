from django.urls import path

from .views import MyConsentsAPIView, TermsConsentAPIView, TermsDetailAPIView, TermsListAPIView

urlpatterns = [
  path("", TermsListAPIView.as_view(), name="terms-document-list"),
  path("my-consents/", MyConsentsAPIView.as_view(), name="my-consents"),
  path("consents/", TermsConsentAPIView.as_view(), name="terms-document-consents"),
  path("<int:pk>/", TermsDetailAPIView.as_view(), name="terms-document-detail"),
]
