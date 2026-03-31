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
  """여러 약관에 한 번에 동의한다."""

  permission_classes = [IsAuthenticated]
  serializer_class = TermsConsentRequestSerializer

  def get_queryset(self):
    """약관 동의 관련 queryset 기본값을 반환한다."""
    return UserConsent.objects.none()

  @extend_schema(
    summary="약관 일괄 동의",
    request=TermsConsentRequestSerializer,
    responses={200: UserConsentSerializer(many=True)},
  )
  def post(self, request):
    request_serializer = self.get_serializer(data=request.data)
    request_serializer.is_valid(raise_exception=True)
    terms_document_ids = request_serializer.validated_data["terms_document_ids"]
    consents = AgreeToTermsDocumentService(
      user=self.current_user,
      terms_document_ids=terms_document_ids,
    ).perform()
    serializer = UserConsentSerializer(consents, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
