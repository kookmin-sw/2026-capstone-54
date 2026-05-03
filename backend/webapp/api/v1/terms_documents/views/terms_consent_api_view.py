from api.v1.terms_documents.serializers import TermsConsentRequestSerializer, UserConsentSerializer
from common.permissions import IsAuthenticated
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from terms_documents.models import UserConsent
from terms_documents.services import AgreeToTermsDocumentService


@extend_schema(tags=["약관"])
class TermsConsentAPIView(BaseAPIView):

  permission_classes = [IsAuthenticated]
  serializer_class = TermsConsentRequestSerializer

  def get_queryset(self):
    return UserConsent.objects.none()

  @extend_schema(
    summary="약관 동의 설정",
    request=TermsConsentRequestSerializer,
    responses={200: UserConsentSerializer(many=True)},
  )
  def post(self, request):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    updates = serializer.validated_data.get("updates", [])

    service = AgreeToTermsDocumentService(
      user=self.current_user,
      updates=updates,
      require_ai_for_free_plan=True,
    )

    consents = service.perform()
    consent_ids = [consent.id for consent in consents]
    consents_qs = UserConsent.objects.select_related("terms_document").filter(id__in=consent_ids)
    response_serializer = UserConsentSerializer(consents_qs, many=True)
    return Response(response_serializer.data, status=status.HTTP_200_OK)
