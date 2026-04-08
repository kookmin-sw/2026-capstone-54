from api.v1.terms_documents.serializers import UserConsentSerializer
from common.permissions import IsAuthenticated
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from terms_documents.models import UserConsent


@extend_schema(tags=["약관"])
class MyConsentsAPIView(BaseAPIView):
  """나의 약관 동의 목록을 반환한다."""
  permission_classes = [IsAuthenticated]
  serializer_class = UserConsentSerializer
  queryset = UserConsent.objects.none()

  def get_queryset(self):
    """현재 사용자의 약관 동의 목록 queryset을 반환한다."""
    return UserConsent.objects.filter(user=self.current_user).select_related("terms_document")

  @extend_schema(
    summary="나의 약관 동의 목록 조회",
    responses={200: UserConsentSerializer(many=True)},
  )
  def get(self, request):
    serializer = UserConsentSerializer(self.get_queryset(), many=True)
    return Response(serializer.data)
