from common.permissions import AllowAny
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from rest_framework.response import Response

from api.v1.terms_documents.serializers import TermsListSerializer
from terms_documents.models import TermsDocument


@extend_schema(tags=["약관"])
class TermsListAPIView(BaseAPIView):
  """공개된 약관 목록을 반환한다."""

  permission_classes = [AllowAny]
  serializer_class = TermsListSerializer

  def get_queryset(self):
    """공개된 약관 목록 queryset을 반환한다."""
    return TermsDocument.objects.published()

  @extend_schema(
    summary="약관 목록 조회",
    responses={200: TermsListSerializer(many=True)},
  )
  def get(self, request):
    serializer = TermsListSerializer(self.get_queryset(), many=True)
    return Response(serializer.data)
